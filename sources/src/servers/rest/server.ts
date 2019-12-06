import {
    inject,
    lifeCycleObserver,
    CoreBindings,
    Application
} from "@loopback/core";
import { Ctor } from "loopback-history-extension";

/** Swagger binding imports */
import { RestServer, RestComponent } from "@loopback/rest";
import { RestExplorerComponent } from "@loopback/rest-explorer";

/** Authentication binding imports */
import { AuthenticationComponent } from "@loopback/authentication";

import { ACLBindings, PrivateACLBindings } from "~/keys";
import { ACLRestServerConfig } from "~/types";
import { Sequence } from "~/servers";

import { User, Group, Role, Permission, Session, Code } from "~/models";

import {
    GenerateUsersController,
    GenerateUsersSelfController,
    GenerateUsersSessionController,
    GenerateUsersAccountController,
    GenerateUsersPasswordController,
    GenerateGroupsController,
    GenerateGroupsUsersController,
    GenerateRolesController,
    GenerateRolesUsersController,
    GenerateRolesGroupsController,
    GenerateRolesPermissionsController,
    GeneratePermissionsController
} from "~/servers/rest/controllers";

@lifeCycleObserver("servers.REST")
export class ACLRestServer extends RestServer {
    constructor(
        @inject(CoreBindings.APPLICATION_INSTANCE)
        app: Application,
        @inject(ACLBindings.REST_SERVER_CONFIG)
        config: ACLRestServerConfig = {},
        @inject(PrivateACLBindings.USER_MODEL)
        userCtor: Ctor<User>,
        @inject(PrivateACLBindings.GROUP_MODEL)
        groupCtor: Ctor<Group>,
        @inject(PrivateACLBindings.ROLE_MODEL)
        roleCtor: Ctor<Role>,
        @inject(PrivateACLBindings.PERMISSION_MODEL)
        permissionCtor: Ctor<Permission>,
        @inject(PrivateACLBindings.SESSION_MODEL)
        sessionCtor: Ctor<Session>,
        @inject(PrivateACLBindings.CODE_MODEL)
        codeCtor: Ctor<Code>
    ) {
        super(app, config);

        /** Fix rest application to rest server bug */
        (this as any).restServer = this;

        /** Set up default home page */
        if (config.homePath) {
            this.static("/", config.homePath);
        }

        /** Bind authentication component */
        app.component(AuthenticationComponent);

        /** Bind swagger component */
        app.component(RestComponent);
        app.bind("RestExplorerComponent.KEY").to(
            new RestExplorerComponent(this as any, {
                path: "/explorer"
            })
        );

        /** Set up the custom sequence */
        this.sequence(Sequence);

        /** Bind users controllers */
        app.controller(GenerateUsersController<User>(userCtor));
        app.controller(GenerateUsersSelfController<User>(userCtor));
        app.controller(
            GenerateUsersSessionController<Session, User>(sessionCtor, userCtor)
        );
        app.controller(
            GenerateUsersAccountController<Code, User>(codeCtor, userCtor)
        );
        app.controller(
            GenerateUsersPasswordController<Code, User>(codeCtor, userCtor)
        );

        /** Bind groups controllers */
        app.controller(GenerateGroupsController<Group>(groupCtor));
        app.controller(GenerateGroupsUsersController<User>(userCtor));

        /** Bind roles controllers */
        app.controller(GenerateRolesController<Role>(roleCtor));
        app.controller(GenerateRolesUsersController<User>(userCtor));
        app.controller(GenerateRolesGroupsController<Group>(groupCtor));
        app.controller(
            GenerateRolesPermissionsController<Permission>(permissionCtor)
        );

        /** Bind permissions controllers */
        app.controller(
            GeneratePermissionsController<Permission>(permissionCtor)
        );
    }

    async start() {
        await super.start();

        console.log(`REST Server is running on url ${this.url}`);
    }
    async stop() {
        await super.stop();

        console.log(`REST Server is stopped!`);
    }
}
