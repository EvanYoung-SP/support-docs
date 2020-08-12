---
title: "Enabling HTTPS Engagement Tracking on SparkPost"
description: "SparkPost supports HTTPS engagement tracking for customers via self-service for all SparkPost customers. To enable SSL engagement tracking for a domain, additional configuration for SSL keys is required."
---

## Overview

SparkPost supports HTTPS engagement tracking for all self-service customers. This article describes how to use a Content Delivery Network (CDN) to enable SSL engagement tracking for your domain. After completing the steps below, your email recipients will see HTTPS links in the email you send. When they visit a tracked link, your CDN will handle the SSL connection, then pass the HTTP request on to SparkPost. SparkPost will record the click event and redirect the recipient to the original URL.

## Configuring SSL Certificates

In order for HTTPS engagement tracking to be enabled on SparkPost, our service needs to present a valid certificate that will be trusted by the email recipient’s browser.  SparkPost does not manage certificates for customer engagement tracking domains, as we are not the record owner for our customers’ domains.

Use a CDN like [Cloudflare](http://www.cloudflare.com) or [Fastly](http://www.fastly.com) to manage certificates and keys for any custom engagement tracking domains.  These services forward traffic onwards to SparkPost so that HTTPS tracking can be performed.

## How to Create a Secure Tracking Domain on SparkPost

In addition to SSL certificates, link forwarding, and page rules (see the step by step guide below), you will need to create a tracking domain with the tracking domains API using the `"secure": true` string. Detailed information on this operation can be found in our API documentation [here](https://developers.sparkpost.com/api/tracking-domains.html#tracking-domains-create-and-list-post).

## How to Switch a Tracking Domain from Insecure to Secure

If you have previously created a tracking domain (whether verified or unverified), and wish to switch it from insecure (the default value for tracking domains) to secure, use the tracking domains API `PUT` call to update the tracking domain with the `"secure": true` string. Detailed information on this operation can be found in our API documentation [here](https://developers.sparkpost.com/api/tracking-domains.html#tracking-domains-retrieve,-update,-and-delete-put).

## Step by Step Guide with CloudFlare

The following is a sample guide for use with CloudFlare **only**; please note, the steps to configure your chosen CDN will likely differ from CloudFlare in workflow. Please refer to your CDN's documentation and contact their respective support departments if you have any questions.

1. Create CloudFlare account
2. Go to “DNS” tab on the CloudFlare UI:

    ![](media/enabling-https-engagement-tracking-on-sparkpost/cloudflare_UI.png)

3. Add domain and then add the following Cloudflare NS records (**please note**, for other providers, the NS records to be used will differ):

    ```
    NS	aron.ns.cloudflare.com
    NS	peyton.ns.cloudflare.com
    ```
    These values can be found under the DNS tab on the Cloudflare UI.

    **Example:**

    Using the domain `track.example.com`, below is a command line DIG command to confirm that the NS records have been updated to reflect the required changes:

    ```
    dig example.com NS

    ; <<>> DiG 9.8.3-P1 <<>> track.example.com NS
    	;; global options: +cmd
    	;; Got answer:
    	;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 25635
    	;; flags: qr rd ra; QUERY: 1, ANSWER: 2, AUTHORITY: 0, ADDITIONAL: 0

    	;; QUESTION SECTION:
    	;track.example.com.			IN	NS

    	;; ANSWER SECTION:
    	track.example.com.		86400	IN	NS	peyton.ns.cloudflare.com.
    	track.example.com.		86400	IN	NS	aron.ns.cloudflare.com.

    	;; Query time: 128 msec
    	;; SERVER: 10.76.3.194#53(10.76.3.194)
    	;; WHEN: Tue May  9 10:15:20 2017
    	;; MSG SIZE  rcvd: 88
    ```

4. Create the appropriate page rule settings for the domain. In the page rules tab, perform the following instructions:
    * Page Rule Tab -> Create Page Rule
    * Enter your domain like so: `track.yourdomain.com/*`
    * Add a Setting -> Forwarding URL (you may need to specify a 301 redirect option)
    * Destination URL is https://<CNAME_VALUE>/$1. Replace <CNAME_VALUE> with the value displayed in the tracking domains section of the SparkPost UI. E.g.: for SparkPost US, this would be `spgo.io`; for SparkPost EU, this would be `eu.spgo.io`; for PMTA+Signals, refer to your user guide.
    * Save and Deploy (turn page rule on)
    
    ![](media/enabling-https-engagement-tracking-on-sparkpost/SSL_full.png)
    
5. Cloudflare has Universal SSL for all accounts, but it's good to ensure that setting on the page rule is "SSL". This is required for how CloudFlare will validate the certificate on the origin.

    ![](media/enabling-https-engagement-tracking-on-sparkpost/page_rule.png)

    
    More information on SSL options for Cloudflare can be found [here](https://support.cloudflare.com/hc/en-us/articles/200170416).

6. Turn the page rule ON. 

7. If you with to also set up [Mobile Universal and App Links](https://www.sparkpost.com/docs/tech-resources/deep-links-self-serve/), an additional page rule is necessary. A prerequisite for this configuration is that the desired universal link files (apple-app-site-assocation/assetlinks.json) are already hosted either via a CDN or webserver.
    * Page Rule Tab -> Create Page Rule
    * Enter your domain like so: `track.yourdomain.com/.well-known/*`
    * Add a Setting -> Forwarding URL (you may need to specify a 301 redirect option)
    * Destination URL is determined by where the universal link files are hosted.  The destination URL should be configured as https://<UNVERSAL_LINK_DESTINATION>/.well-known/$1.  Note that CloudFlare page rules are evaluated in priority order.  This page rule should be first, with the page rule from Step 4 second.

    ![](media/enabling-https-engagement-tracking-on-sparkpost/cloudflare_universal_links_page_rule.png)

8. Add a CNAME entry into DNS for your tracking domain. The value in the record doesn't matter; the record simply needs to exist. For example, if your tracking domain is `track.example.com`, a CNAME value of `example.com` is sufficient. Without a record to reference, the the page rule never gets triggered, and the proper redirection will not occur. Please note that the typical time to progagation of new CNAME records is often around five to ten minutes, but can be longer depending on your DNS provider.

9. Run the [Update a Tracking Domain API](https://developers.sparkpost.com/api/tracking-domains/#tracking-domains-put-update-a-tracking-domain) using the following Post Data:

    ```
    {
        "port"    : 443,
        "secure"  : true
    }
    ```

Note: If you would like this tracking domain to be the default, please add `"default": true` to the JSON object above, before updating the domain.

10. Navigate to the Tracking Domains section in the UI and click the orange "test" verification link. At this point, the process is complete.

## Step by Step Guide with Fastly

Sign up for Fastly or log in to an existing account.

1. Click **Configure** on the Dashboard.
2. Click the gear icon to open the **Manage Service** menu and click **Create**.

Set the options as follows:

Server address and port: For SparkPost US, this would be `spgo.io :  443`; for SparkPost EU, this would be `eu.spgo.io : 443`
Domain: Your click tracking domain, e.g. `click.business.com`
Description: SparkPost (or whatever you like!)
