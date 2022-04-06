import { IncomingMessage } from "http";
import * as qs from 'qs';
import { TextualBodyOptions } from "./index";
import { readText } from "./text";

import cinnamonInternals from "@apollosoftwarexyz/cinnamon-internals";

export type QueryStringOptions = qs.IParseOptions;

export async function readUrlEncoded(req: IncomingMessage, options?: TextualBodyOptions, qsOptions?: QueryStringOptions) : Promise<{
    parsed: any;
    raw: string;
}> {

    const raw = await readText(req, {
        limit: options?.limit ?? '56kb'
    });

    if (typeof raw !== 'string') {
        throw new cinnamonInternals.error.HttpError(
            "Invalid request body character encoding",
            415
        )
    }

    try {
        const parsed = qs.parse(raw, qsOptions);

        return {
            parsed,
            raw
        }
    } catch(ex) {
        throw new cinnamonInternals.error.HttpError(
            "Failed to parse request body",
            400,
            ex
        );
    }

}
