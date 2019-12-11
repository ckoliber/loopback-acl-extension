import { inject } from "@loopback/context";
import { HttpErrors, Request } from "@loopback/rest";
import { TokenService } from "@loopback/authentication";

import {
    AuthorizationBindings,
    GetUserPermissionsFn
} from "loopback-authorization-extension";

import { ACLBindings } from "../../../keys";
import { ACLPermissions } from "../../../types";

import { Session, User, UserRelations } from "../../../models";
import { SessionRepository, UserRepository } from "../../../repositories";

import { randomBytes } from "crypto";

export class BearerTokenService implements TokenService {
    constructor(
        @inject(ACLBindings.SESSION_REPOSITORY)
        protected sessionRepository: SessionRepository<Session>,
        @inject(ACLBindings.USER_REPOSITORY)
        protected userRepository: UserRepository<User, UserRelations>,
        @inject(AuthorizationBindings.GET_USER_PERMISSIONS_ACTION)
        protected getUserPermissions: GetUserPermissionsFn<ACLPermissions>
    ) {}

    async verifyToken(token: string): Promise<Session | any> {
        if (!token) {
            throw new HttpErrors.Unauthorized(
                `Error verifying token: token is null`
            );
        }

        /** Check session is valid and exists */
        const session = await this.sessionRepository.get(token);
        if (!session) {
            throw new HttpErrors.Unauthorized(
                `Error getting session: session not found`
            );
        }

        /** Update session expiration per request */
        await this.sessionRepository.expire(token, session.ttl);

        return session;
    }

    async generateToken(user: User & Request & any): Promise<string> {
        if (!user) {
            throw new HttpErrors.Unauthorized(
                "Error generating token: user is null"
            );
        }

        /** Find active user */
        const userObject = await this.userRepository.findOne({
            where: {
                username: user.username,
                password: user.password,
                status: "Active"
            }
        });
        if (!userObject) {
            throw new HttpErrors.Unauthorized(
                "Error generating token: user not found"
            );
        }

        /** Generate token */
        const token = randomBytes(48).toString("hex");

        /** Get user permissions */
        const permissions = await this.getUserPermissions(user.id);

        /** Set constants */
        const ttl = 300e3; // 300 seconds
        const ip = user.ip;
        const device = user.headers["user-agent"];

        /** Save session */
        await this.sessionRepository.set(
            token,
            new Session({
                token: token,
                ip: ip,
                date: new Date(),
                ttl: ttl,
                device: device,
                permissions: permissions
            })
        );

        /** Set session expiration time (in millis) */
        await this.sessionRepository.expire(token, ttl);

        return token;
    }
}
