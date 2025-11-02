import axios from 'axios';
// import { config } from '../config';

interface PaystackInitializeParams {
    amount: number;  // amount in kobo
    email: string;
    reference: string;
    callback_url: string;
}

interface PaystackResponse {
    authorization_url: string;
    access_code: string;
    reference: string;
}

export const initializePaystackPayment = async (params: PaystackInitializeParams): Promise<PaystackResponse> => {
    try {
        const response = await axios.post(
            'https://api.paystack.co/transaction/initialize',
            params,
            {
                headers: {
                    'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const { data } = response.data;
        return {
            authorization_url: data.authorization_url,
            access_code: data.access_code,
            reference: data.reference
        };
    } catch (error) {
        if (axios.isAxiosError(error)) {
            throw new Error(`Paystack initialization failed: ${error.response?.data?.message || error.message}`);
        }
        throw error;
    }
};

export const verifyPaystackPayment = async (reference: string) => {
    try {
        const response = await axios.get(
            `https://api.paystack.co/transaction/verify/${reference}`,
            {
                headers: {
                    'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
                }
            }
        );

        return response.data.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            throw new Error(`Paystack verification failed: ${error.response?.data?.message || error.message}`);
        }
        throw error;
    }
};