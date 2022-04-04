/**
 * @internal
 * @private
 * @module @apollosoftwarexyz/cinnamon-internals
 */
import { error as _error } from './namespace/error';
import { data as _data } from './namespace/data';
import { fs as _fs } from './namespace/fs';
/**
 * @internal
 *
 * <br>
 *
 * ### Cinnamon Internal Namespaces
 *
 * These namespaces are intended for internal use by the Cinnamon framework and its core modules. Whilst they are,
 * strictly speaking, visible to external packages, their use for anything other than by the framework, internally, is
 * _highly discouraged_, because there are no guarantees made about their API surface or its stability or consistency.
 * These APIs are intended to be flexible for the organization of the internal framework only.
 *
 * <br>
 *
 * **TL;DR:** Do not use anything in this namespace if you're not working on a component of the framework itself.
 */
declare namespace cinnamonInternals {
    export import error = _error;
    export import data = _data;
    export import fs = _fs;
}
export default cinnamonInternals;
