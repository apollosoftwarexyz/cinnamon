import Cinnamon, { Database } from '@apollosoftwarexyz/cinnamon';

export default (async () => {
    const framework = await Cinnamon.initialize({
        silenced: true,
        autostartServices: false
    });

    return framework.getModule<Database>(Database.prototype).ormConfig;
})();
