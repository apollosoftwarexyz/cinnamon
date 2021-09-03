import {Context, Controller, Method, Middleware, Route} from "@apollosoftwarexyz/cinnamon";
import PureVibesOnly from "../middleware/PureVibesOnly";

@Controller('api', 'v1')
export default class IndexController {

    @Middleware(PureVibesOnly)
    @Route(Method.GET, '/')
    public async index(ctx: Context) : Promise<void> {
        ctx.body = "Hello, world!";
    }

}
