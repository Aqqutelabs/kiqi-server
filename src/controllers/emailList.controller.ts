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
}