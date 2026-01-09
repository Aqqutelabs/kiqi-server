import { ListModel } from "../../models/CampaignList";
import { Types } from "mongoose";
import { ContactSyncService } from "./contact-sync.service";
import { EmailistServiceImpl } from "./emailList.service.impl";

export class ListService {
  private contactSyncService: ContactSyncService;
  private emailListService: EmailistServiceImpl;

  constructor() {
    this.contactSyncService = new ContactSyncService();
    this.emailListService = new EmailistServiceImpl();
  }

  public async createList(userId: string, name: string, description?: string) {
    const newList = await ListModel.create({
      userId: new Types.ObjectId(userId),
      name,
      description
    });

    // Create a corresponding email list
    await this.emailListService.createEmailList({
      email_listName: name,
      emails: [], // Initially empty, can be updated later
      emailFiles: [],
      userId
    });

    return newList;
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

  public async getListById(userId: string, listId: string) {
    // Return list details with populated contacts
    return await ListModel.findOne({
      _id: new Types.ObjectId(listId),
      userId: new Types.ObjectId(userId)
    }).populate('contacts');
  }

  public async addContactsToList(userId: string, listId: string, contactIds: string[]) {
    // $addToSet ensures we don't add the same contact twice
    const updatedList = await ListModel.findOneAndUpdate(
      { _id: listId, userId: new Types.ObjectId(userId) },
      { $addToSet: { contacts: { $each: contactIds.map(id => new Types.ObjectId(id)) } } },
      { new: true }
    );

    // Sync to corresponding Email List and SMS Group
    if (updatedList) {
      await this.contactSyncService.syncCrmListToEmailList(userId, listId);
      await this.contactSyncService.syncCrmListToSmsGroup(userId, listId);
    }

    return updatedList;
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