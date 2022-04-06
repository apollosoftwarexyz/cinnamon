import { IncomingMessage } from "http";
import { TextualBodyOptions } from "./index";
import {readText} from "./text";

import cinnamonInternals from "@apollosoftwarexyz/cinnamon-internals";

export const jsonMimeTypes = [
    'application/json',
    'application/json-patch+json',
    'application/vnd.api+json',
    'application/csp-report'
];

export async function readJson(
    req: IncomingMessage,
    options?: TextualBodyOptions,
    strict: boolean = false
) : Promise<{
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
        let parsed = JSON.parse(raw);

        if (strict) {
            if (!Array.isArray(parsed) && typeof parsed !== 'object') {
                throw new cinnamonInternals.error.HttpError(
                    "Invalid JSON; the top-level item must be an object or an array",
                    400
                );
            }
        }

        return {
            parsed,
            raw
        }
    } catch(ex) {
        throw new cinnamonInternals.error.HttpError(
            "Failed to parse JSON request body",
            400,
            ex
        );
    }

}
