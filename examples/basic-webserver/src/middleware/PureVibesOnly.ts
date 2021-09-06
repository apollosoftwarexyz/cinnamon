import { Context, Next } from "@apollosoftwarexyz/cinnamon";

/**
 * A middleware function to ensure only requests with pure vibes may access
 * the server.
 */
export default function PureVibesOnly(ctx: Context, next: Next) : Promise<any> {
    if (ctx.request.query['vibes'] !== 'pure') {
        ctx.status = 401;
        ctx.body = "Your vibes are not pure! :(";
        return;
    } else return next();
}

