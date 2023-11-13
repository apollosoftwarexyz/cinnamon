import { MiddlewareFn } from '../../api/Middleware';
import { Fields, Files, IncomingForm, Options as FormidableOptions } from 'formidable';

import cinnamonInternals, { $Cinnamon } from '@apollosoftwarexyz/cinnamon-internals';
import { readText } from './text';
import { jsonMimeTypes, readJson } from './json';
import { readUrlEncoded } from './urlencoded';
import { Request } from '../../../../index';

type KnownBodyTypes = 'json' | 'urlencoded' | 'text' | 'multipart';

export interface TextualBodyOptions {

    /**
     * The character encoding that should be used to decode the request body.
     * If not specified either here, or in the request body, UTF-8 will be used by default.
     *
     * If the encoding is specified in the request, that value will be used instead of this one.
     */
    defaultEncoding?: string;

    /**
     * If specified, the maximum body size to accept.
     * If this is a number, it is the number of bytes.
     */
    limit?: string | number;

}

export function Body(options?: {

    /**
     * The HTTP methods to parse the body for. If set to "all" or true, this will accept all methods.
     * Otherwise, only the specified methods will be accepted.
     *
     * Default: ["POST", "PUT" and "PATCH"].
     */
    acceptedMethods?: 'all' | true | string[];

    /**
     * Whether text payloads should be parsed.
     * Default: true
     */
    text?: boolean;

    /**
     * Whether JSON payloads should be parsed.
     * Default: true
     */
    json?: boolean;

    /**
     * If specified, the options to parse to the qs package, responsible for parsing
     * query strings.
     */
    jsonOptions?: {

        /**
         * Whether JSON payloads need to adhere to 'strict' JSON standards.
         * This means the JSON payload's top-level element must be an array or object.
         *
         * Default: false
         */
        strict?: boolean;

    }

    /**
     * Whether URL-encoded payloads should be parsed.
     * Default: true
     */
    urlencoded?: boolean;

    /**
     * If specified, the options to apply when parsing request bodies that ARE NOT multipart
     * forms.
     */
    options?: TextualBodyOptions;

    /**
     * Whether multipart forms should be parsed.
     * Default: false
     */
    multipart?: boolean;

    /**
     * If specified, the options to pass to the formidable package, responsible for
     * parsing multipart forms.
     */
    multipartOptions?: FormidableOptions;

    /**
     * If specified, will be used as a mapping between a custom mime type and one of the types
     * recognized by this middleware: 'json', 'urlencoded', 'text' or 'multipart'.
     */
    customTypes?: {
        [key: string]: KnownBodyTypes;
    }
}) : MiddlewareFn {

    options = cinnamonInternals.data.mergeObjectDeep({
        acceptedMethods: ['POST', 'PUT', 'PATCH'],
        json: true,
        urlencoded: true,
        multipart: false
    }, options ?? {});

    // Validate the acceptedMethods argument.
    if (!Array.isArray(options?.acceptedMethods)
        && options?.acceptedMethods !== true
        && options?.acceptedMethods !== 'all') {
        throw new Error(
            `Invalid parameter value: acceptedMethods = ${options?.acceptedMethods}. ` +
            `If set, it must be an array or "all".`
        );
    }

    return async function (ctx, next) : Promise<void> {

        if (!options) throw new cinnamonInternals.error.AssertionError('Options must be set');

        (ctx.request as Request<any> & { [$Cinnamon]: any })[$Cinnamon].bodyError =
            `You're attempting to read the body on a ${ctx.method.toUpperCase()} request, however that request is ` +
            `only configured to accept bodies on the following methods:\n` +
            `>\t[${(options!.acceptedMethods as string[]).join(',')}]` +
            `\n`;

        // If the request method was not one of the accepted methods (and the accepted methods wasn't
        // a string or true
        if (Array.isArray(options!.acceptedMethods) &&
            !options!.acceptedMethods.map(method => method.toUpperCase()).includes(ctx.method.toUpperCase())) {
            return await next();
        }

        // Initialize body and rawBody.
        // Ironically, we can do this by setting to 'undefined', because we can signal to Cinnamon's
        // loader that these have been set by triggering the flag, regardless of what we set these
        // to.
        ctx.request.body = undefined;
        ctx.request.rawBody = undefined;

        let customType: KnownBodyTypes;
        if (options!.customTypes && options!.customTypes[ctx.type])
            customType = options!.customTypes[ctx.type];

        // Attempt to parse multipart forms.
        if (options!.multipart && ctx.is('multipart') || (customType && customType === 'multipart')) {

            const form = new IncomingForm(options!.multipartOptions);

            try {
                const parsedForm = await new Promise<{ fields: Fields, files: Files }>((_, reject) => {
                    form.parse(ctx.req, (err, fields, files) => {
                        if (err) return reject(err);
                        return { fields, files };
                    });
                });

                ctx.request.body = parsedForm.fields;
                ctx.request.files = parsedForm.files;
            } catch(err) {
                throw new cinnamonInternals.error.HttpError(
                    'Failed to parse multipart form',
                    400,
                    err
                );
            }

        } else {

            // Attempt to parse the body if it is a recognized text type.

            if (options!.json && (ctx.is(jsonMimeTypes) || (customType && customType === 'json'))) {

                const processed = await readJson(ctx.req, options?.options, options?.jsonOptions?.strict);

                ctx.request.body = processed.parsed;
                ctx.request.rawBody = processed.raw;

            } else if (options!.urlencoded && (ctx.is('urlencoded') || (customType && customType === 'urlencoded'))) {

                const processed = await readUrlEncoded(ctx.req, options?.options);

                ctx.request.body = processed.parsed;
                ctx.request.rawBody = processed.raw;

            } else if (options!.text && (ctx.is('text/*') || (customType && customType === 'text'))) {

                // Read the request body and assign it to both body and rawBody.
                // We assign it to rawBody directly as obviously a text-based body will just be
                // the raw payload, but if other middlewares parse the text content (e.g., an XML
                // parser).
                ctx.request.body = await readText(ctx.req, options?.options);
                ctx.request.rawBody = ctx.request.body;

            }

        }

        return await next();

    };

}
