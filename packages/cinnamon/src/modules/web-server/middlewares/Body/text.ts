import { IncomingMessage } from "http";

import { TextualBodyOptions } from "./index";
import { determineCharset, inflateStream, readStream } from "./raw";

export async function readText(req: IncomingMessage, options?: TextualBodyOptions) {

    const charset = determineCharset(req) ?? options?.defaultEncoding ?? 'utf-8';

    const lengthHeader = req.headers['content-length'];
    const encoding = req.headers['content-encoding'] || 'identity';

    let length;
    if (lengthHeader && encoding === 'identity') length = parseInt(lengthHeader);

    const limit = options?.limit ?? '1mb';
    return await readStream(inflateStream(req), { charset, length, limit });

}
