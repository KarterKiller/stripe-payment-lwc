public class StripePaymentController {
    
    @AuraEnabled
    public static String createPaymentSession(
        String opportunityId,
        String opportunityName,
        Decimal amount,
        String currencyCode
    ) {
        HttpRequest req = new HttpRequest();
        req.setEndpoint('https://stripe-salesforce-integration-lxelir.5sc6y6-1.usa-e2.cloudhub.io/payment/create-session');
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/json');
        
        Map<String, Object> body = new Map<String, Object>{
            'opportunityId' => opportunityId,
            'opportunityName' => opportunityName,
            'amount' => amount,
            'currency' => currencyCode.toLowerCase()
        };
        req.setBody(JSON.serialize(body));
        req.setTimeout(30000);
        
        Http http = new Http();
        HttpResponse res = http.send(req);
        
        if (res.getStatusCode() == 200) {
            Map<String, Object> result = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
            return (String) result.get('checkoutUrl');
        } else {
            throw new AuraHandledException('Erreur Stripe: ' + res.getBody());
        }
    }
}