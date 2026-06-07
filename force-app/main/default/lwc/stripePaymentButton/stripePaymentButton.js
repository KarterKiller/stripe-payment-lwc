import { LightningElement, api, wire } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import createPaymentSession from '@salesforce/apex/StripePaymentController.createPaymentSession';

import NAME_FIELD from '@salesforce/schema/Opportunity.Name';
import AMOUNT_FIELD from '@salesforce/schema/Opportunity.Amount';
import STAGE_FIELD from '@salesforce/schema/Opportunity.StageName';

export default class StripePaymentButton extends LightningElement {
    @api recordId;

    checkoutUrl = null;
    isLoading = false;
    errorMessage = null;

    @wire(getRecord, { recordId: '$recordId', fields: [NAME_FIELD, AMOUNT_FIELD, STAGE_FIELD] })
    opportunity;

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

    get isClosedWon() {
        return this.stage === 'Closed Won';
    }

    get canGeneratePayment() {
        return ['Proposal/Price Quote', 'Negotiation/Review', 'Value Proposition'].includes(this.stage);
    }

    get generateBtnClass() {
        return this.isLoading ? 'generate-btn loading' : 'generate-btn';
    }

    // Timeline steps — done
    get step1Done() { return true; }
    get step2Done() { return !!this.checkoutUrl || this.isClosedWon; }
    get step3Done() { return !!this.checkoutUrl || this.isClosedWon; }
    get step4Done() { return this.isClosedWon; }
    get step5Done() { return this.isClosedWon; }

    // Timeline steps — active (clignotant)
    get step1Active() { return !this.checkoutUrl && !this.isClosedWon; }
    get step4Active() { return !!this.checkoutUrl && !this.isClosedWon; }

    // Timeline classes
    get step1Class() { 
    return 'step-dot done'; // Salesforce toujours vert
    }

    get step2Class() { 
    return this.step2Done ? 'step-dot done' : ((!this.checkoutUrl && !this.isClosedWon) ? 'step-dot active' : 'step-dot pending'); 
    }
    get step3Class() { 
    return this.step3Done ? 'step-dot done' : 'step-dot pending'; 
    }
    get step4Class() { 
    return this.step4Done ? 'step-dot done' : (this.step4Active ? 'step-dot active' : 'step-dot pending'); 
    }
    get step5Class() { 
    return this.step5Done ? 'step-dot done' : 'step-dot pending'; 
    }

    // Timeline icons
    get step2Icon() { return this.step2Done ? '✓' : '○'; }
    get step3Icon() { return this.step3Done ? '✓' : '○'; }
    get step4Icon() { return this.step4Done ? '✓' : (this.step4Active ? '⏳' : '○'); }
    get step5Icon() { return this.step5Done ? '✓' : '○'; }

    // Timeline lines
    get line1Class() { return this.step2Done ? 'timeline-line done' : 'timeline-line pending'; }
    get line2Class() { return this.step3Done ? 'timeline-line done' : 'timeline-line pending'; }
    get line3Class() { return this.step4Done ? 'timeline-line done' : 'timeline-line pending'; }
    get line4Class() { return this.step5Done ? 'timeline-line done' : 'timeline-line pending'; }

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