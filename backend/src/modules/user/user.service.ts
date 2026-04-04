import UserModel from '~/database/models/user.model'

export class UserSerivce {
  async findUserById(userId: string) {
    return await UserModel.findById(userId, { password: false })
  }
}
