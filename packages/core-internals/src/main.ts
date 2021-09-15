import { data as _data } from './namespace/data';
import { fs as _fs } from './namespace/fs';

namespace cinnamonInternals {
    export import data = _data;
    export import fs = _fs;
}

export default cinnamonInternals;
