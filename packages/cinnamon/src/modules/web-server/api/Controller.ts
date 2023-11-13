import { v5 as uuidv5 } from 'uuid';
import Loader, { activeLoader, LOADER_ROOT_ROUTE_NAMESPACE } from '../loader';
import LoggerModule from '../../logger';

/**
 * Registers a class as a Cinnamon API controller.
 * Each entry in the 'group' array is a 'directory' in the path that each
 * member of this controller will be prefixed with. For example, if the
 * group is ['api', 'v1', 'example'], each route in the controller will
 * be prefixed with /api/v1/example from the base URL of the web server.
 *
 * @param group The API 'group' this controller belongs to.
 */
export default function Controller(...group: string[]) {
    return function (target: any) {

        if (!activeLoader) throw new Error('Failed to identify the active loader.');

        if (!target._loaderId) {
            activeLoader.framework.getModule<LoggerModule>(LoggerModule.prototype).warn(`Empty controller ${target.name} detected. Skipping loading.`);
            return;
        }

        if (target._loaderIgnored) {
            return;
        }

        // Gather class data.
        const classIdentifier = target._loaderId;
        const controller = uuidv5(classIdentifier, LOADER_ROOT_ROUTE_NAMESPACE);

        Loader.loadController(controller, group, target);

    };
}
