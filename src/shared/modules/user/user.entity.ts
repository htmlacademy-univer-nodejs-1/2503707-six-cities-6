import { defaultClasses, getModelForClass, prop, modelOptions } from '@typegoose/typegoose';
import { User } from '../../types/index.js';
import { createSHA256 } from '../../helpers/index.js';

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export interface UserEntity extends defaultClasses.Base {}

@modelOptions({
  schemaOptions: {
    collection: 'users'
  }
})
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class UserEntity extends defaultClasses.TimeStamps implements User {
  @prop({ unique: true, required: true })
  public email: string;

  @prop({ required: false, default: '', alias: 'avatarUrl' })
  public avatar: string;

  @prop({ required: true, default: '' })
  public name: string;

  @prop({ required: true, default: '' })
  private password?: string;

  @prop({ required: false, default: false })
  public isPro: boolean;

  constructor(userData: User & { avatarUrl?: string }) {
    super();

    this.email = userData.email;
    this.avatar = userData.avatar ?? userData.avatarUrl ?? '';
    this.name = userData.name;
  }

  public setPassword(password: string, salt: string) {
    this.password = createSHA256(password, salt);
  }

  public getPassword() {
    return this.password;
  }
}

export const UserModel = getModelForClass(UserEntity);
