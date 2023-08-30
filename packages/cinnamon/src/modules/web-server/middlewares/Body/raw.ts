import * as zlib from "zlib";
import { Buffer } from "buffer";
import { getDecoder as getIconvDecoder, DecoderStream } from 'iconv-lite';
import { IncomingMessage } from "http";

import cinnamonInternals from "@apollosoftwarexyz/cinnamon-internals";

/**
 * Attempts to fetch a decoder for the specified character set encoding, throwing a Cinnamon HttpError
 * if it is unable.
 * @param encoding
 * @private
 */
function getCharsetDecoder(encoding?: string) : DecoderStream | undefined {
    if (!encoding) return undefined;

    try {
        return getIconvDecoder(encoding);
    } catch(ex) {
        throw new cinnamonInternals.error.HttpError(
            `Unsupported character set`,
            415
        )
    }
}

/**
 * Halts the specified stream.
 * @param stream
 * @private
 */
function haltStream(stream: IncomingMessage) {
    stream.unpipe();
    stream.pause();
}

/**
 * Attempts to determine the character set from a node HTTP request (IncomingMessage),
 * based on the content-type header.
 *
 * If it could not be detected, returns undefined, otherwise returns the character set.
 *
 * @param req The request to determine the character set for.
 */
export function determineCharset(req: IncomingMessage) : string | undefined {
    const type = req.headers['content-type'];
    if (type && type.includes(";")) {

        // Loop over all parameters in the content-type header, if there are any.
        for (const parameter of type.split(';').slice(1)) {

            // Split the parameter into its constituent parts.
            const parts = parameter.split("=");

            if (parts.length < 2) continue;

            // If the key part is charset, ignoring leading/trailing whitespace...
            if (parts[0].trim() === 'charset') {
                // ...take the value, stripping out any trailing/leading whitespace, then
                // stripping out any trailing/leading quotes.

                // Assuming, then, that a value was present, we'll use it.
                return parts[1].trim()
                    .replace(/^"?/, '')
                    .replace(/"?$/, '');
            }
        }

    }
}

/**
 * Pipes the specified stream through a zlib decompressor.
 * If the stream encoding is not one of the supported types, a Cinnamon HttpError will be thrown.
 *
 * @param stream The stream to decompress.
 * @param encoding The HTTP stream encoding (supported types: 'gzip', 'deflate' or 'identity').
 */
export function inflateStream(stream: IncomingMessage, encoding?: string) : IncomingMessage {

    encoding = encoding
        || (stream.headers && stream.headers['content-encoding'])
        || 'identity';

    switch (encoding) {
        case 'gzip':
        case 'deflate':
            break;
        case 'identity':
            return stream;
        default:
            throw new cinnamonInternals.error.HttpError(
                `Unsupported Content-Encoding type: ${encoding}`,
                415
            );
    }

    return stream.pipe(zlib.createInflate()) as unknown as IncomingMessage;

}

/**
 * Reads the specified IncomingMessage, either as a Buffer or, if an encoding is set, a string.
 *
 * This is implemented as an alternative to:
 * https://github.com/stream-utils/raw-body/
 *
 * @param stream The stream to read.
 * @param options
 */
export async function readStream(stream: IncomingMessage, options?: {
    /**
     * The character encoding to use.
     * If not specified, a buffer will be returned. Otherwise, the payload will be a string, decoded accordingly.
     */
    charset?: string;

    /**
     * The length of the payload to receive.
     */
    length?: string | number;

    /**
     * The limit of bytes to receive.
     */
    limit?: string | number;
}) : Promise<Buffer | string> {

    options = options ?? {};

    if (options.length && typeof options.length === 'string')
        options.length = cinnamonInternals.format.parseBytes(options.length);

    if (options.limit && typeof options.limit === 'string')
        options.limit = cinnamonInternals.format.parseBytes(options.limit);

    // If the length is bigger than the length, throw a 413 (too large) error.
    if (options.limit !== undefined && options.length !== undefined && options.length > options.limit) {
        throw new cinnamonInternals.error.HttpError(
            'Request entity too large',
            413
        );
    }

    // Ensure that the stream is readable.
    if (!stream.readable) {
        throw new cinnamonInternals.error.HttpError(
            'Stream not readable',
            500
        );
    }

    try {

        const decoder = getCharsetDecoder(options!.charset);

        return await new Promise<Buffer | string>((resolve, reject) => {

            let buffer : string | Uint8Array[] = decoder ? '' : [];

            function cleanup(error?: Error) {
                complete = true;

                stream.removeListener('aborted', onAborted);
                stream.removeListener('data', onData);
                stream.removeListener('end', onEnd);
                stream.removeListener('error', onEnd);
                stream.removeListener('close', cleanup);

                if (error) {
                    haltStream(stream);
                    return error;
                }
            }

            stream.on('aborted', onAborted);
            stream.on('data', onData);
            stream.on('error', onEnd);
            stream.on('end', onEnd);
            stream.on('close', cleanup);

            let complete: boolean = false;
            let received: number = 0;

            function onData(chunk: any) {
                // If we've processed the entire response body, do not handle
                // any more incoming data.
                if (complete) return;

                // Otherwise, add the length of the chunk to the received
                // counter.
                received += chunk.length;

                // At this point, we know the type of options.length is number,
                // so we can safely compare it to received.
                if (options!.limit !== undefined && received >
                    (options!.limit as unknown as number)) {

                    // If the number of received bytes exceeds the limit, throw
                    // an HTTP 413 error.
                    return reject(cleanup(new cinnamonInternals.error.HttpError(
                        'Request entity too large',
                        413
                    )));
                } else if (decoder) {
                    // If a character set decoder is specified, decode the
                    // payload as a string using that decoder. (As we're
                    // receiving the response body in chunks, we just append
                    // them together into a string buffer.)
                    buffer += decoder.write(chunk);
                } else {
                    // Otherwise, we're receiving the response body as a
                    // buffer, so we just append the chunks to the buffer
                    // array. (If we get sent a string, we know a character
                    // set decoder was not specified but it should have been,
                    // so we'll throw an error and clean up).
                    if (typeof buffer !== "string") {
                        buffer.push(chunk);
                    } else {
                        return reject(cleanup(new cinnamonInternals.error.HttpError(
                            'An internal server error occurred whilst parsing the payload',
                            500
                        )));
                    }
                }
            }

            function onAborted() {
                if (complete) return;

                return reject(cleanup(new cinnamonInternals.error.HttpError(
                    'Request aborted',
                    400
                )));
            }

            function onEnd(error?: Error) {
                if (complete) return;
                if (error) {
                    return reject(cleanup(error));
                }

                if (options!.length !== undefined && received !== options!.length) {
                    return reject(cleanup(new cinnamonInternals.error.HttpError(
                        'Request size did not match content length',
                        400
                    )));
                } else {
                    complete = true;

                    if (typeof buffer === "string") {
                        return resolve(buffer + (decoder!.end() || ''))
                    }

                    return resolve(Buffer.concat(buffer));
                }
            }

        });

    } catch(err) {
        throw err instanceof cinnamonInternals.error.HttpError
            ? err
            : new cinnamonInternals.error.HttpError(
                'An unexpected error occurred',
                500
            );
    }

}
