import { Banner } from "@payloadcms/ui";
import Link from "next/link";
import React from "react";

import { SeedButton } from "@/components/BeforeDashboard/SeedButton";
import "@/components/BeforeDashboard/index.scss";

const baseClass = "before-dashboard";

export const DashboardIntro: React.FC = () => {
  return (
    <div className={baseClass}>
      <Banner className={`${baseClass}__banner`} type="success">
        <h4>Welcome to your dashboard!</h4>
      </Banner>

      <div className={`${baseClass}__intro`}>
        Here&apos;s what to do next:
        <ul className={`${baseClass}__instructions`}>
          <li>
            <SeedButton />
            {" with a few products and pages to jump-start your new project, then "}
            <Link href="/">visit your website</Link>
            {" to see the results."}
          </li>
          <li>
            {"Head over to "}
            <a
              href="https://dashboard.paystack.com/#/settings/developer"
              rel="noopener noreferrer"
              target="_blank"
            >
              Paystack to obtain your API Keys
            </a>
            {
              ". Create a new account if needed, then copy them into your environment variables and restart your server. See the "
            }
            <a href="https://paystack.com/docs" rel="noopener noreferrer" target="_blank">
              Paystack Docs
            </a>
            {" for more details."}
          </li>
          <li>
            {"Modify your "}
            <a
              href="https://payloadcms.com/docs/configuration/collections"
              rel="noopener noreferrer"
              target="_blank"
            >
              collections
            </a>
            {" and add more "}
            <a
              href="https://payloadcms.com/docs/fields/overview"
              rel="noopener noreferrer"
              target="_blank"
            >
              fields
            </a>
            {" as needed. If you are new to Payload, we also recommend you check out the "}
            <a
              href="https://payloadcms.com/docs/getting-started/what-is-payload"
              rel="noopener noreferrer"
              target="_blank"
            >
              Getting Started
            </a>
            {" docs."}
          </li>
        </ul>
        {"Pro Tip: This dashboard now uses Payload widgets for the analytics and ops cards. "}
        <a
          href="https://payloadcms.com/docs/admin/components#base-component-overrides"
          rel="noopener noreferrer"
          target="_blank"
        >
          Admin components
        </a>
        {" still control this intro section."}
      </div>
    </div>
  );
};
