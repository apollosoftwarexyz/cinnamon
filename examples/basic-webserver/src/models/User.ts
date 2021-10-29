import { Entity, PrimaryKey, SerializedPrimaryKey } from '@apollosoftwarexyz/cinnamon/database';
import { ObjectId } from '@mikro-orm/mongodb';

@Entity()
export class User {

    @PrimaryKey()
    _id!: ObjectId;

    @SerializedPrimaryKey()
    id!: string;

}
