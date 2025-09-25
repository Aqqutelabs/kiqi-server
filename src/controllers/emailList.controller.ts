import { NextFunction, Request, Response } from "express";
import { EmailistServiceImpl } from "../services/impl/emailList.service.impl";
import { StatusCodes } from "http-status-codes";

// Extend Express Request interface to include 'user'
declare module "express-serve-static-core" {
    interface Request {
        user?: {
            _id?: string;
            id?: string;
            [key: string]: any;
        };
    }
}

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
            let { email_listName, emails, emailFiles } = req.body;
            // If a CSV file is uploaded, parse it
            if (req.file && req.file.mimetype === 'text/csv') {
                const { parseEmailsFromCsv } = require('../utils/csvParser');
                emails = parseEmailsFromCsv(req.file.buffer);
            }
            // Validate emails: must be array of objects with email (fullName is optional)
            if (!Array.isArray(emails) || emails.some(e => !e.email)) {
                res.status(StatusCodes.BAD_REQUEST).json({
                    error: true,
                    message: "Each email must have an email address. Format: [{ email: string, fullName?: string }]"
});
                return;
            }
            // Only use _id, and ensure it's a valid ObjectId string
            const userId = req.user?._id;
            if (!userId || typeof userId !== 'string' || userId.length !== 24) {
                res.status(StatusCodes.BAD_REQUEST).json({
                    error: true,
                    message: "Authenticated user does not have a valid MongoDB ObjectId (_id)."
                });
                return;
            }
            const emailList = await this.emailListService.createEmailList({ email_listName, emails, emailFiles, userId });

            res.status(StatusCodes.CREATED).json({
                error: false,
                message: "Email list has been created.",
                data: emailList
            });
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

    public getEmailListsByUser = async (
        req: Request & { user?: any },
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try{
            const userId = req.user?._id || req.user?.id;
            const emailLists = await this.emailListService.getEmailListsByUser(userId);
            res.status(200).json({
                error: false,
                data: emailLists
            })
        } catch(error){
            next(error)
        }
    }
}