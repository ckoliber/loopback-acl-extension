import {
    inject,
    lifeCycleObserver,
    CoreBindings,
    Application
} from "@loopback/core";

import { Sequence } from "@acl/servers/rest/sequence";
import * as path from "path";

/** Swagger binding imports */
import {
    RestServer,
    RestComponent,
    RestBindings,
    RestServerConfig
} from "@loopback/rest";
import { RestExplorerComponent } from "@loopback/rest-explorer";

/** Authentication binding imports */
import { AuthenticationComponent } from "@loopback/authentication";

@lifeCycleObserver("servers.REST")
export class ACLRestServer extends RestServer {
    constructor(
        @inject(CoreBindings.APPLICATION_INSTANCE)
        app: Application,
        @inject(RestBindings.CONFIG)
        config: RestServerConfig = {}
    ) {
        super(app, config);

        // Set up the custom sequence
        this.sequence(Sequence);

        // Set up default home page
        this.static("/", path.join(__dirname, "../../../public"));

        // fix rest application to rest server bug
        (this as any).restServer = this;

        this.bindAuthentication(app);
        this.bindSwagger(app);
    }

    private bindAuthentication(app: Application) {
        app.component(AuthenticationComponent);
    }

    private bindSwagger(app: Application) {
        app.component(RestComponent);
        app.bind("RestExplorerComponent.KEY").to(
            new RestExplorerComponent(this as any, {
                path: "/explorer"
            })
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
