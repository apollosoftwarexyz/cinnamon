import { Chalk, Context, Controller, Logger, Method, Middleware, Route } from '@apollosoftwarexyz/cinnamon';
import PureVibesOnly from '../middleware/PureVibesOnly';

@Controller('api', 'v1')
export default class IndexController {

    @Middleware(PureVibesOnly)
    @Route(Method.GET, '/')
    public async index(ctx: Context) : Promise<void> {
        Logger.info(Chalk.greenBright('You have pure vibes.'));
        ctx.body = 'Hello, world!';
    }

}
