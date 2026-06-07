import { LightningElement, api, wire } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import createPaymentSession from '@salesforce/apex/StripePaymentController.createPaymentSession';
import STAGE_FIELD from '@salesforce/schema/Opportunity.StageName';

import NAME_FIELD from '@salesforce/schema/Opportunity.Name';
import AMOUNT_FIELD from '@salesforce/schema/Opportunity.Amount';

export default class StripePaymentButton extends LightningElement {
    @api recordId;

    checkoutUrl = null;
    isLoading = false;
    errorMessage = null;

    @wire(getRecord, { recordId: '$recordId', fields: [NAME_FIELD, AMOUNT_FIELD, STAGE_FIELD] })
    opportunity;

    get generateBtnClass() {
    return this.isLoading ? 'generate-btn loading' : 'generate-btn';

    }

    get canGeneratePayment() {
    const stage = getFieldValue(this.opportunity.data, STAGE_FIELD);
    return ['Proposal/Price Quote', 'Negotiation/Review', 'Value Proposition'].includes(stage);
    }


    get isClosedWon() {
    return getFieldValue(this.opportunity.data, STAGE_FIELD) === 'Closed Won';
    }

    get opportunityName() {
        return getFieldValue(this.opportunity.data, NAME_FIELD) || '';
    }

    get amount() {
        return getFieldValue(this.opportunity.data, AMOUNT_FIELD) || 0;
    }

    get currency() {
        return 'eur';
    }

    get stage() {
    return getFieldValue(this.opportunity.data, STAGE_FIELD) || '';
    }

    async handleGenerate() {
        this.isLoading = true;
        this.errorMessage = null;
        this.checkoutUrl = null;

        try {
            this.checkoutUrl = await createPaymentSession({
                opportunityId: this.recordId,
                opportunityName: this.opportunityName,
                amount: this.amount,
                currencyCode: this.currency
            });
        } catch (error) {
            this.errorMessage = error.body?.message || 'Erreur lors de la génération du lien';
        } finally {
            this.isLoading = false;
        }
    }

    handleCopy() {
        navigator.clipboard.writeText(this.checkoutUrl);
        this.dispatchEvent(new ShowToastEvent({
            title: 'Copié !',
            message: 'Lien de paiement copié dans le presse-papier',
            variant: 'success'
        }));
    }

    handleOpen() {
        window.open(this.checkoutUrl, '_blank');
    }
}