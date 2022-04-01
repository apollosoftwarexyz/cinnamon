/**
 * Registers a class as a Cinnamon API controller.
 * Each entry in the 'group' array is a 'directory' in the path that each
 * member of this controller will be prefixed with. For example, if the
 * group is ['api', 'v1', 'example'], each route in the controller will
 * be prefixed with /api/v1/example from the base URL of the web server.
 *
 * @param group The API 'group' this controller belongs to.
 */
export default function Controller(...group: string[]): (target: any) => void;
