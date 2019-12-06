import { Class } from "@loopback/repository";
import { Ctor } from "loopback-history-extension";
import { post, get, del, requestBody, getModelSchemaRef } from "@loopback/rest";
import { authenticate } from "@loopback/authentication";

import { ACLController } from "~/servers";
import { Session, Token, User } from "~/models";

export function GenerateUsersSessionController<
    SessionModel extends Session,
    UserModel extends User
>(
    sessionCtor: Ctor<SessionModel>,
    userCtor: Ctor<UserModel>
): Class<ACLController> {
    class UsersSessionController extends ACLController {
        @post("/users/session", {
            responses: {
                "200": {
                    description: "Create Session",
                    content: {
                        "application/json": {
                            schema: getModelSchemaRef(Token, {
                                includeRelations: true
                            })
                        }
                    }
                }
            }
        })
        async signIn(
            @requestBody({
                content: {
                    "application/json": {
                        schema: getModelSchemaRef(userCtor, {
                            exclude: Object.keys(
                                userCtor.definition.properties
                            ).filter(
                                key => key !== "username" && key != "password"
                            ) as any
                        })
                    }
                }
            })
            user: User
        ): Promise<Token> {
            const token = await this.tokenService.generateToken({
                ...this.request,
                ...user
            } as any);

            return new Token({
                token: token
            });
        }

        @authenticate("bearer")
        @get("/users/session", {
            responses: {
                "200": {
                    description: "Get Session",
                    content: {
                        "application/json": {
                            schema: getModelSchemaRef(sessionCtor, {
                                includeRelations: true
                            })
                        }
                    }
                }
            }
        })
        async sign(): Promise<Session> {
            return this.session;
        }

        @authenticate("bearer")
        @del("/users/session", {
            responses: {
                "204": {
                    description: "Delete Session"
                }
            }
        })
        async signOut(): Promise<void> {
            await this.sessionRepository.delete(this.session.token);
        }
    }

    return UsersSessionController;
}
