import { NextFunction, Request, Response } from "express";
import { EmailistServiceImpl } from "../services/impl/emailList.service.impl";
import { StatusCodes } from "http-status-codes";

export class EmailListController {
    private emailListService: EmailistServiceImpl

    constructor () {
        this.emailListService = new EmailistServiceImpl()
    }

    public createEmailList = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try{
            const {email_listName, emails, emailFiles} = req.body
            const emailList = await this.emailListService.createEmailList({email_listName, emails, emailFiles})

            res.status(StatusCodes.CREATED).json({
                error: false,
                message: "Email list has been created.",
                data: emailList
            })
        } catch(error){
            next(error)
        }
    }

    public getAllEmailLists = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try{
            const emailLists = await this.emailListService.getAllEmailLists();

            res.status(StatusCodes.OK).json({
                data: emailLists
            })
        } catch(error) {
            next(error)
        }
    }

    public getEmailList = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try{
            const id = req.params.id
            const emailList = await this.emailListService.getEmailList(id)

            res.status(StatusCodes.OK).json({
                error: false,
                data: emailList
            })
        } catch(error){
            next(error)
        }
    }

    public addEmailListContacts = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try{
            const id = req.params.id
            const {firstName, lastName, emailAddress, phoneNumber, groupEmailList} = req.body
            const contact = await this.emailListService.addEmailListContacts(id, {firstName, lastName, emailAddress, phoneNumber, groupEmailList})

            res.status(StatusCodes.CREATED).json({
                error: false,
                message: "Contact has been added to the email list.",
                data: contact
            })
        } catch(error){
            next(error)
        }
    }

    public getAllContacts = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try{
            const contacts = await this.emailListService.getAllContacts()

            res.status(StatusCodes.CREATED).json({
                error: false,
                contacts
            })
        }catch(error){
            next(error)
        }
    }

    public deleteEmailListContact = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try{
            const id = req.params.id
            const contactId = req.params.contactId
            await this.emailListService.deleteEmailListContact(id, contactId)

            res.status(StatusCodes.OK).json({
                error: false,
                message: "Contact has been deleted from the email list."
            })
        } catch(error){
            next(error)
        }
    }
}