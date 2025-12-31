import { ListModel } from "../../models/CampaignList";
import { Types } from "mongoose";

export class ListService {
  public async createList(userId: string, name: string, description?: string) {
    return await ListModel.create({
      userId: new Types.ObjectId(userId),
      name,
      description
    });
  }

  public async getListsForUser(userId: string) {
    // We use aggregation to count contacts in each list for the UI table
    return await ListModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId) } },
      {
        $project: {
          name: 1,
          description: 1,
          createdAt: 1,
          updatedAt: 1,
          contactCount: { $size: "$contacts" }
        }
      },
      { $sort: { createdAt: -1 } }
    ]);
  }

  public async addContactsToList(userId: string, listId: string, contactIds: string[]) {
    // $addToSet ensures we don't add the same contact twice
    return await ListModel.findOneAndUpdate(
      { _id: listId, userId: new Types.ObjectId(userId) },
      { $addToSet: { contacts: { $each: contactIds.map(id => new Types.ObjectId(id)) } } },
      { new: true }
    );
  }

  public async removeContactFromList(userId: string, listId: string, contactId: string) {
    return await ListModel.findOneAndUpdate(
      { _id: listId, userId: new Types.ObjectId(userId) },
      { $pull: { contacts: new Types.ObjectId(contactId) } },
      { new: true }
    );
  }

  public async deleteList(userId: string, listId: string) {
    return await ListModel.deleteOne({
      _id: new Types.ObjectId(listId),
      userId: new Types.ObjectId(userId)
    });
  }
}