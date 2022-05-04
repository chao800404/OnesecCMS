import React from "react";

import { User as FirebaseUser } from "firebase/auth";
import {
    Authenticator,
    buildCollection,
    FirebaseCMSApp,
    NavigationBuilder,
    NavigationBuilderProps
} from "@camberi/firecms";
import { getAnalytics } from "firebase/analytics";
import productSchema , {Product} from './schema/product.schema';
import localeSchema from './schema/local.schema';
import {blogSchema , sampleAdditionalExportColumn} from './schema/blog.schema';
import {usersSchema } from './schema/users_schema';
import {customSchemaOverrideHandler} from './schema/custom_schema_resolver';


import logo from "./assets/onese-logo.webp";

import "typeface-rubik";
import "typeface-space-mono";
import firebaseConfig from './config/firebase.config';







export default function App() {

    const usersCollection = buildCollection({
        path: "users",
        schema: usersSchema,
        name: "Users",
        group: "Main",
        description: "Registered users",
        textSearchEnabled: true,
        additionalColumns: [
            {
                id: "sample_additional",
                title: "Sample additional",
                builder: ({entity}) => `Generated column: ${entity.values.first_name}`,
                dependencies: ["first_name"]
            }
        ],
        properties: ["first_name", "last_name", "email", "liked_products", "picture", "phone", "sample_additional"]
    });

    const onFirebaseInit = (config: Object) => {
        // Just calling analytics enables screen tracking
        getAnalytics();
    };

    const productsCollection =  buildCollection<Product>({
        path: "products",
        schema: productSchema,
        name: "Products",
        permissions: ({ authController }) => ({
            edit: true,
            create: true,
            // we have created the roles object in the navigation builder
            delete: authController.extra.roles.includes("admin")
        }),
        subcollections: [
            buildCollection({
                name: "Locales",
                path: "locales",
                schema: localeSchema
            })
        ]
    })


    const blogCollection = buildCollection({
        path: "blog",
        schema: blogSchema,
        name: "Blog",
        group: "Content",
        exportable: {
            additionalColumns: [sampleAdditionalExportColumn]
        },
        defaultSize: "l",
        properties: ["name", "header_image", "status", "content", "reviewed", "gold_text"],
        description: "Collection of blog entries included in our [awesome blog](https://www.google.com)",
        textSearchEnabled: true,
        initialFilter: {
            "status": ["==", "published"]
        }
    });

    const navigation: NavigationBuilder = async ({
                                                     user,
                                                     authController
                                                 }: NavigationBuilderProps) => {

        return ({
            collections: [
                productsCollection,
                blogCollection,
                usersCollection
            ]
        });
    };

    const myAuthenticator: Authenticator<FirebaseUser> = async ({
                                                                    user,
                                                                    authController
                                                                }) => {
        // You can throw an error to display a message
        if(user?.email?.includes("flanders")){
            throw Error("Stupid Flanders!");
        }
        
        console.log("Allowing access to", user?.email);
        // This is an example of retrieving async data related to the user
        // and storing it in the user extra field.
        const sampleUserData = await Promise.resolve({
            roles: ["admin"]
        });
        authController.setExtra(sampleUserData);
        return true;
    };

    return <FirebaseCMSApp
        name={"Onesec CMS"}
        authentication={myAuthenticator}
        navigation={navigation}
        firebaseConfig={firebaseConfig}
        logo={logo}
        allowSkipLogin={true}
        onFirebaseInit={onFirebaseInit}
        schemaOverrideHandler={customSchemaOverrideHandler}
        signInOptions={[
            'password',
            'google.com',
            // 'phone',
            // 'anonymous',
            // 'facebook.com',
            // 'github.com',
            // 'twitter.com',
            // 'microsoft.com',
            // 'apple.com'
        ]}
        
    />;
}
