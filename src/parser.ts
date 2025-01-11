import { Lex } from "./lex";
import Logger from "./log";
import {
    SyntaxObject,
    OutputObject,
    Syntax,
    Variable,
    ControleObject,
} from "./types";

export class Parser {
    lex: Lex | undefined;

    constructor() {
        this.lex = undefined;
    }

    _rootExpression(): SyntaxObject {
        let left = this._condConcatExpression();
        if (left == undefined) {
            Logger.error(
                "syntax error(top level expression):%d - %o",
                this.lex?.getLine(),
                this.lex?.getText()
            );
            throw new Error("syntax error(top level expression)");
        }
        let token = this.lex.getToken();
        if (token == "=") {
            this.lex.next();
            let right = this._rootExpression();
            if (right == undefined) {
                Logger.error(
                    "syntax error(top level expression):%d - %o",
                    this.lex?.getLine(),
                    this.lex?.getText()
                );
                throw new Error("syntax error(top level expression)");
            }
            const operator = {
                type: token,
                variable: undefined,
                value: undefined,
                left: left,
                right: right,
            };
            return operator;
        }
        return left;
    }

    _condConcatExpression(): SyntaxObject {
        let left = this._compareExpression();
        if (left == undefined) {
            Logger.error(
                "syntax error(cond concat expression):%d - %o",
                this.lex?.getLine(),
                this.lex?.getText()
            );
            throw new Error("syntax error(cond concat expression)");
        }
        let token = this.lex.getToken();
        if (token == "&" || token == "|") {
            this.lex.next();
            let right = this._condConcatExpression();
            if (right == undefined) {
                Logger.error(
                    "syntax error(cond concat expression):%d - %o",
                    this.lex?.getLine(),
                    this.lex?.getText()
                );
                throw new Error("syntax error(cond concat expression)");
            }
            const operator = {
                type: token,
                variable: undefined,
                value: undefined,
                left: left,
                right: right,
            };
            return operator;
        }
        return left;
    }

    _compareExpression(): SyntaxObject {
        let left = this._addSubExpression();
        if (left == undefined) {
            Logger.error(
                "syntax error(compare expression):%d - %o",
                this.lex?.getLine(),
                this.lex?.getText()
            );
            throw new Error("syntax error(compare expression)");
        }
        let token = this.lex.getToken();
        if (
            token == ">=" ||
            token == "<=" ||
            token == "==" ||
            token == "!=" ||
            token == ">" ||
            token == "<"
        ) {
            this.lex.next();
            let right = this._compareExpression();
            if (right == undefined) {
                Logger.error(
                    "syntax error(compare expression):%d - %o",
                    this.lex?.getLine(),
                    this.lex?.getText()
                );
                throw new Error("syntax error(compare expression)");
            }
            const operator = {
                type: token,
                variable: undefined,
                value: undefined,
                left: left,
                right: right,
            };
            return operator;
        }
        return left;
    }

    _addSubExpression(): SyntaxObject {
        let left = this._mulDivExpression();
        if (left == undefined) {
            Logger.error(
                "syntax error(add/sub expression) %d - %o",
                this.lex?.getLine(),
                this.lex?.getText()
            );
            throw new Error("syntax error(add/sub expression)");
        }
        let token = this.lex?.getToken();
        if (token == "+" || token == "-") {
            this.lex?.next();
            let right = this._addSubExpression();
            if (right == undefined) {
                Logger.error(
                    "syntax error(add/sub expression) %d - %o",
                    this.lex?.getLine(),
                    this.lex?.getText()
                );
                throw new Error("syntax error(add/sub expression)");
            }
            const operator = {
                type: token,
                variable: undefined,
                value: undefined,
                left: left,
                right: right,
            };
            return operator;
        }
        return left;
    }

    _mulDivExpression(): SyntaxObject {
        let left = this._factor();
        if (left == undefined) {
            Logger.error(
                "syntax error(mul/div expression) %d - %o",
                this.lex?.getLine(),
                this.lex?.getText()
            );
            throw new Error("syntax error(mul/div expression)");
        }
        let token = this.lex?.getToken();
        if (token == "*" || token == "/") {
            this.lex?.next();
            let right = this._mulDivExpression();
            if (right == undefined) {
                Logger.error(
                    "syntax error(mul/div expression) %d - %o",
                    this.lex?.getLine(),
                    this.lex?.getText()
                );
                throw new Error("syntax error(mul/div expression)");
            }
            const operator = {
                type: token,
                variable: undefined,
                value: undefined,
                left: left,
                right: right,
            };
            return operator;
        }
        return left;
    }

    _factor(): SyntaxObject {
        let token = this.lex?.getToken();
        if (token == "-") {
            this.lex.next();
            let right = this._term();
            if (right == undefined) {
                Logger.error(
                    "syntax error(illegal position of operation symbol) %s - %o",
                    this.lex.getLine(),
                    token
                );
                throw new Error(
                    "syntax error(illegal position of operation symbol)"
                );
            }
            const obj: SyntaxObject = {
                type: "*",
                variable: undefined,
                value: undefined,
                right: right,
                left: {
                    type: "number",
                    value: -1,
                    variable: undefined,
                    left: undefined,
                    right: undefined,
                },
            };
            return obj;
        } else if (token == "(") {
            this.lex.next();
            const obj = this._rootExpression();
            token = this.lex.getToken();
            if (obj == undefined || token != ")") {
                Logger.error(
                    "syntax error(illegal position of operation symbol) %s - %o",
                    this.lex.getLine(),
                    token
                );
                throw new Error(
                    "syntax error(illegal position of operation symbol)"
                );
            }
            this.lex.next();
            return obj;
        } else if (token == "!") {
            this.lex.next();
            let right = this._rootExpression();
            if (right == undefined) {
                Logger.error(
                    "syntax error(illegal position of operation symbol) %s - %o",
                    this.lex.getLine(),
                    token
                );
                throw new Error(
                    "syntax error(illegal position of operation symbol)"
                );
            }
            const obj: SyntaxObject = {
                type: "!",
                variable: undefined,
                value: undefined,
                right: right,
                left: undefined,
            };
            return obj;
        }
        return this._term();
    }

    _term(): SyntaxObject {
        let token = this.lex?.getToken();
        if (token == "-") {
        }
        if (
            token == "string" ||
            token == "number" ||
            token == "int" ||
            token == "json"
        ) {
            const literal = this._literal();
            if (literal == undefined) {
                Logger.error(
                    "syntax error(unknown literal value) %d - %o",
                    this.lex?.getLine(),
                    this.lex?.getText()
                );
                throw new Error("syntax error(unknown literal value)");
            }
            return literal;
        } else if (token == "id") {
            const ident = this._ident();
            return ident;
        }
        Logger.error(
            "syntax error(not found variables or literals) %d - %o",
            this.lex?.getLine(),
            this.lex?.getText()
        );
        throw new Error("syntax error(not found variables or literals)");
    }

    _ident(): SyntaxObject {
        let name = this.lex?.getText();
        var variable: Variable = { name: name!, member: undefined };
        var obj: SyntaxObject = {
            type: "var",
            variable: variable,
            value: undefined,
            left: undefined,
            right: undefined,
        };
        let token = this.lex?.next();
        while (token == ".") {
            token = this.lex?.next();
            if (token == "id") {
                name = this.lex?.getText();
                var member: Variable = {
                    name: name!,
                    member: undefined,
                };
                variable.member = member;
                variable = member;
            } else {
                Logger.error(
                    "syntax error(unknown token) %d - %o",
                    this.lex?.getLine(),
                    this.lex?.getText()
                );
                throw new Error("syntax error(unknown token)");
            }
            token = this.lex?.next();
        }
        return obj;
    }

    _literal(): SyntaxObject | undefined {
        let token = this.lex?.getToken();
        let value = this.lex?.getText();
        this.lex?.next();
        if (token == "number") {
            const ite = {
                type: "number",
                value: parseFloat(value!),
                variable: undefined,
                left: undefined,
                right: undefined,
            };
            return ite;
        } else if (token == "int") {
            const ite = {
                type: "number",
                value: parseInt(value!),
                variable: undefined,
                left: undefined,
                right: undefined,
            };
            return ite;
        } else if (token == "string") {
            const ite = {
                type: "string",
                value: value,
                variable: undefined,
                left: undefined,
                right: undefined,
            };
            return ite;
        } else if (token == "json") {
            const ite = {
                type: "json",
                value: value,
                variable: undefined,
                left: undefined,
                right: undefined,
            };
            return ite;
        }
        return undefined;
    }

    _identStatement(syntaxList: Syntax[]): void {
        let syntax = this._rootExpression();
        if (syntax == undefined) {
            Logger.error(
                "syntax error(illigale ident statement) %d - %s",
                this.lex.getLine(),
                this.lex.getToken()
            );
            throw new Error("syntax error(illigale ident statement)");
        }

        syntaxList.push(syntax);
    }

    _httpStatement(syntaxList: Syntax[]): void {
        const method = this.lex.getToken();

        const url = this.lex.nextURL();
        if (url == undefined) {
            Logger.error(
                "syntax error(no URL) %d - %o",
                this.lex.getLine(),
                this.lex.getText()
            );
            throw new Error("syntax error(no URL)");
        }
        let token = this.lex.next();
        if (token != "\n") {
            Logger.error(
                "syntax error(illegal http expression) %d - %o",
                this.lex.getLine(),
                this.lex.getText()
            );
            throw new Error("syntax error(illegal http expression)");
        }

        const httpObject = {
            type: "http",
            method: method,
            url: url,
            headers: [],
            parameters: [],
            body: undefined,
            bind: undefined,
        };

        let keyName = this.lex.nextKey();
        token = this.lex.getToken();
        while (token != "\n" && token != undefined) {
            if (token != "string" || keyName == undefined) {
                Logger.error(
                    "syntax error(parameter value error) %d - %o",
                    this.lex.getLine(),
                    token
                );
                throw new Error("syntax error(parameter value error)");
            }
            const key = keyName.toUpperCase();

            if (key != "PARAMETER" && key != "BODY" && key != "BIND") {
                const value = this.lex.nextValue();
                if (value == undefined) {
                    Logger.error(
                        "syntax error(header value error) %d - %o",
                        this.lex.getLine(),
                        this.lex.getText()
                    );
                    throw new Error("syntax error(header value error)");
                }

                const header = {
                    key: key,
                    value: value,
                };
                httpObject.headers.push(header);
            } else if (key == "PARAMETER") {
                const value = this.lex.nextValue();
                token = this.lex.getToken();
                if (token != "string" || value == undefined) {
                    Logger.error(
                        "syntax error(request parameter is not string) %d - %o",
                        this.lex.getLine(),
                        this.lex.getText()
                    );
                    throw new Error(
                        "syntax error(request parameter is not string)"
                    );
                }
                httpObject.parameters.push(value);
            } else if (key == "BODY") {
                const value = this.lex.nextValue();
                token = this.lex.getToken();
                if (value == undefined) {
                    Logger.error(
                        "syntax error(body value error) %d - %o",
                        this.lex.getLine(),
                        this.lex.getText()
                    );
                    throw new Error("syntax error(body value error)");
                }
                if (token != "string" && token != "json") {
                    Logger.error(
                        "syntax error(body value error) %d - %o",
                        this.lex.getLine(),
                        this.lex.getText()
                    );
                    throw new Error("syntax error(body value error)");
                }
                const body = {
                    type: token,
                    value: value,
                };
                httpObject.body = body;
            } else if (key == "BIND") {
                token = this.lex.next();
                const value = this.lex.getText();
                if (token != "id") {
                    Logger.error(
                        "syntax error(bind parameter is not variable) %d - %o",
                        this.lex.getLine(),
                        this.lex.getText()
                    );
                    throw new Error(
                        "syntax error(bind parameter is not variable)"
                    );
                }
                httpObject.bind = value;
            }
            token = this.lex.next();
            if (token != "\n") {
                Logger.error(
                    "syntax error(no end of line) %d - %o",
                    this.lex.getLine(),
                    this.lex.getText()
                );
                throw new Error("syntax error(no end of line)");
            }
            keyName = this.lex.nextKey();
            token = this.lex.getToken();
        }
        syntaxList.push(httpObject);
        this.lex.next();
    }

    _controlStatement(syntaqxList: Syntax[]): void {
        let token = this.lex.getToken();
        if (token != "IF" && token != "WHILE") {
            return;
        }
        const obj: ControleObject = {
            type: "",
            cond: undefined,
            syntaxList: [],
        };
        this.lex.next();
        if (token == "IF") {
            obj.type = "if";
            let syntaxObj = this._rootExpression();
            obj.cond = syntaxObj;
            syntaqxList.push(obj);
        } else if (token == "WHILE") {
            obj.type = "while";
            let syntaxObj = this._rootExpression();
            obj.cond = syntaxObj;
            syntaqxList.push(obj);
        }
        token = this.lex.getToken();
        if (token != "\n") {
            Logger.error(
                "syntax error(no end of line) %d - %o",
                this.lex.getLine(),
                token
            );
            throw new Error("syntax error(no end of line)");
        }
        this.lex.next();
        let subroutinList: Syntax[] = [];
        this._parse(subroutinList);
        obj.syntaxList = subroutinList;
    }

    _sleepStatement(syntaqxList: Syntax[]): void {
        let token = this.lex.getToken();
        if (token != "sleep") {
            return;
        }
        const obj: ControleObject = {
            type: "sleep",
            cond: undefined,
            syntaxList: undefined,
        };
        this.lex.next();
        let syntaxObj = this._rootExpression();
        obj.cond = syntaxObj;
        token = this.lex.getToken();
        if (token != "\n") {
            Logger.error(
                "syntax error(no end of line) %d - %o",
                this.lex.getLine(),
                token
            );
            throw new Error("syntax error(no end of line)");
        }
        this.lex.next();
        syntaqxList.push(obj);
    }

    _stdioutStatement(syntaxList: Syntax[]): void {
        const token = this.lex.getToken();
        if (token == "string") {
            const value = this.lex.getText();
            //Logger.log(value);
            const msg: OutputObject = {
                type: "output",
                value: value as string,
            };
            syntaxList.push(msg);
        }
        this.lex?.next();
    }

    _parse(syntaxList: Syntax[]): void {
        while (1) {
            const token = this.lex.getToken();
            if (token == null) {
                break;
            }
            if (token == "\n") {
                this.lex.next();
                continue;
            }
            switch (token) {
                case "id":
                    this._identStatement(syntaxList);
                    break;
                case "GET":
                case "POST":
                case "PUT":
                case "PATCH":
                case "DELETE":
                    this._httpStatement(syntaxList);
                    break;
                case "IF":
                case "WHILE":
                    this._controlStatement(syntaxList);
                    break;
                case "END":
                    this.lex.next();
                    return;
                case "sleep":
                    this._sleepStatement(syntaxList);
                    break;
                default:
                    this._stdioutStatement(syntaxList);
                    break;
            }
        }
    }

    parse(sentence: string): Array<Syntax> {
        this.lex = new Lex(sentence);

        var syntaxList: Syntax[] = [];

        this.lex.next();
        this._parse(syntaxList);

        return syntaxList;
    }
}
