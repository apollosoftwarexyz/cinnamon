import Cinnamon, { DatabaseModule } from '@apollosoftwarexyz/cinnamon';

export default new Promise(async (resolve) => {
    await Cinnamon.initialize({
        silenced: true,
        autostartServices: false
    });

    return resolve(DatabaseModule.ormConfig);
});
