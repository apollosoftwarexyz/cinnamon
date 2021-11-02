import Cinnamon, { Database } from '@apollosoftwarexyz/cinnamon';

export default new Promise(async (resolve) => {
    let framework = await Cinnamon.initialize({
        silenced: true,
        autostartServices: false
    });

    return resolve(framework.getModule<Database>(Database.prototype).ormConfig);
});
