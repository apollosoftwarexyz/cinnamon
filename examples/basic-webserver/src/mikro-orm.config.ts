import Cinnamon, { DatabaseModule } from '@apollosoftwarexyz/cinnamon';

export default new Promise(async (resolve, reject) => {
    await Cinnamon.initialize({
        silenced: true,
        autostart: false
    });

    return resolve(DatabaseModule.ormConfig);
});
