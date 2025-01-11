import {
    Syntax,
    SyntaxObject,
    OutputObject,
    HttpObject,
    HttpHeader,
    Variable,
    HttpResponseObject,
    ControleObject,
    ScriptMode,
    ExpressionObject,
} from "./types";
import Logger from "./log";
import { HttpReq } from "./http";
import { setTimeout } from "timers/promises";
import { keyInput } from "./input";

type Value = {
    type: string;
    value: any;
};

type StackObj = {
    type: string;
    value: Value | undefined;
    variable: Variable | undefined;
};

export default class Interprit {
    variables: { [key: string]: Value | undefined } = {};
    stack: Array<StackObj> = [];
    cmdlineParam: Array<string>;
    mode: ScriptMode;
    stop: boolean = false;

    constructor(_cmdlineParam: Array<string> | undefined, _mode: ScriptMode) {
        this.variables = {};
        this.stack = [];
        this.cmdlineParam = _cmdlineParam;
        this.mode = _mode;
    }

    _getVariableValue(variable: Variable): Value | undefined {
        let name = variable.name;
        let value = this.variables[name];
        if (value == undefined) {
            return undefined;
        }
        if (value.type != "json") {
            return value;
        }
        let retValue = {
            type: value.type,
            value: value.value,
        };
        let memberValue = value.value;
        while (variable.member != undefined) {
            variable = variable.member;
            memberValue = memberValue[variable.name];
        }
        if (typeof memberValue == "object") {
            retValue.type = "json";
            retValue.value = memberValue;
        } else {
            retValue.type = typeof memberValue;
            retValue.value = memberValue;
        }
        return retValue;
    }

    _getValueFromVariablePath(path: string): Value | undefined {
        let pathArray = path.split(".");
        let value = this.variables[pathArray[0]];
        if (value == undefined) {
            return undefined;
        }
        if (value.type != "json") {
            return value;
        }
        let retValue = {
            type: value.type,
            value: value.value,
        };

        let memberValue = value.value;
        for (let i = 1; i < pathArray.length; i++) {
            memberValue = memberValue[pathArray[i]];
        }

        if (typeof memberValue == "object") {
            retValue.type = "json";
            retValue.value = memberValue;
        } else {
            retValue.type = typeof memberValue;
            retValue.value = memberValue;
        }
        return retValue;
    }

    _hasVariableInStr(str: string): boolean {
        for (var i = 0; i < str.length; i++) {
            if (str[i] == "$") {
                if (str[i + 1] == "{") {
                    return true;
                }
            }
        }
        return false;
    }

    _convertVariableInStr(str: string): string {
        var rs: string = "";
        var index = 0;

        if (!this._hasVariableInStr(str)) {
            return str;
        }

        while (1) {
            var c = str[index++];
            if (c == undefined) {
                break;
            }
            if (c == "$" && str[index] == "{") {
                index++;
                var key = "";
                while (1) {
                    c = str[index++];
                    if (c == undefined || c == "}") {
                        break;
                    }
                    key += c;
                }
                // console.log(key);
                if (key.length > 0) {
                    var value = undefined;
                    if (!isNaN(parseInt(key))) {
                        const idx = parseInt(key);
                        if (
                            this.cmdlineParam != undefined &&
                            this.cmdlineParam.length < idx
                        ) {
                            value = this.cmdlineParam[idx];
                        }
                    } else {
                        //value = this.variables[key];
                        value = this._getValueFromVariablePath(key);
                    }
                    // console.log("%o", value);
                    if (value != undefined) {
                        if (value.type == "json") {
                            c = JSON.stringify(value.value, null, 2);
                        } else {
                            c = value.value;
                        }
                    } else {
                        c = "";
                    }
                }
            }
            rs += c;
        }
        return rs;
    }

    _strToJson(str: string): object {
        var obj = JSON.parse(str);
        return obj;
    }

    _checkArithmeticObj(obj: StackObj, allowString: boolean): boolean {
        if (obj == undefined) {
            return false;
        }
        if (obj.type == "json") {
            return false;
        }
        if (!allowString && obj.type == "string") {
            return false;
        }

        if (obj.type == "var") {
            if (obj.variable == undefined) {
                return false;
            }
            let value = this._getVariableValue(obj.variable);
            if (value == undefined) {
                return false;
            }
            if (value.type == "json") {
                return false;
            }
            if (!allowString && value.type == "string") {
                return false;
            }
            if (value.value == undefined) {
                return false;
            }
        }
        return true;
    }

    _addExecute(): void {
        var obj1 = this.stack.pop();
        var obj2 = this.stack.pop();

        if (
            !this._checkArithmeticObj(obj1, true) ||
            !this._checkArithmeticObj(obj2, true)
        ) {
            Logger.error("semantic error. can't add undefined.");
            throw new Error("semantic error. can't add undefined.");
        }

        var obj1Value = obj1.value;
        var obj2Value = obj2.value;
        if (obj1.type == "var") {
            if (obj1.variable)
                obj1Value = this._getVariableValue(obj1.variable);
        }
        if (obj2.type == "var") {
            if (obj2.variable)
                obj2Value = this._getVariableValue(obj2.variable);
        }

        var value = obj2Value.value + obj1Value.value;
        const res: Value = {
            type: typeof value,
            value: value,
        };
        this.stack.push({
            type: res.type,
            value: res,
            variable: undefined,
        });
    }

    _subExecute(): void {
        var obj1 = this.stack.pop();
        var obj2 = this.stack.pop();

        if (
            !this._checkArithmeticObj(obj1, false) ||
            !this._checkArithmeticObj(obj2, false)
        ) {
            Logger.error("semantic error. can't sub undefined.");
            throw new Error("semantic error. can't sub undefined.");
        }
        var obj1Value = obj1.value;
        var obj2Value = obj2.value;
        if (obj1.type == "var") {
            if (obj1.variable)
                obj1Value = this._getVariableValue(obj1.variable);
        }
        if (obj2.type == "var") {
            if (obj2.variable)
                obj2Value = this._getVariableValue(obj2.variable);
        }

        var value = obj2Value.value - obj1Value.value;
        const res: Value = {
            type: typeof value,
            value: value,
        };
        this.stack.push({
            type: res.type,
            value: res,
            variable: undefined,
        });
    }

    _mulExecute(): void {
        var obj1 = this.stack.pop();
        var obj2 = this.stack.pop();

        if (
            !this._checkArithmeticObj(obj1, false) ||
            !this._checkArithmeticObj(obj2, false)
        ) {
            Logger.error("semantic error. can't mul undefined.");
            throw new Error("semantic error. can't mul undefined.");
        }
        var obj1Value = obj1.value;
        var obj2Value = obj2.value;
        if (obj1.type == "var") {
            if (obj1.variable)
                obj1Value = this._getVariableValue(obj1.variable);
        }
        if (obj2.type == "var") {
            if (obj2.variable)
                obj2Value = this._getVariableValue(obj2.variable);
        }

        var value = obj2Value.value * obj1Value.value;
        const res: Value = {
            type: typeof value,
            value: value,
        };
        this.stack.push({
            type: res.type,
            value: res,
            variable: undefined,
        });
    }

    _divExecute(): void {
        var obj1 = this.stack.pop();
        var obj2 = this.stack.pop();

        if (
            !this._checkArithmeticObj(obj1, false) ||
            !this._checkArithmeticObj(obj2, false)
        ) {
            Logger.error("semantic error. can't div undefined.");
            throw new Error("semantic error. can't div undefined.");
        }
        var obj1Value = obj1.value;
        var obj2Value = obj2.value;
        if (obj1.type == "var") {
            if (obj1.variable)
                obj1Value = this._getVariableValue(obj1.variable);
        }
        if (obj2.type == "var") {
            if (obj2.variable)
                obj2Value = this._getVariableValue(obj2.variable);
        }

        if (obj1Value.value == 0) {
            Logger.error("can't divide by 0");
            throw new Error("can't divide by 0");
        }
        var value = obj2Value.value / obj1Value.value;
        const res: Value = {
            type: typeof value,
            value: value,
        };
        this.stack.push({
            type: res.type,
            value: res,
            variable: undefined,
        });
    }

    _largerThenExecute(eqOpt: boolean): void {
        var obj1 = this.stack.pop();
        var obj2 = this.stack.pop();

        if (
            !this._checkArithmeticObj(obj1, true) ||
            !this._checkArithmeticObj(obj2, true)
        ) {
            Logger.error("semantic error. can't comparison undefined.");
            throw new Error("semantic error. can't comparison undefined.");
        }

        var obj1Value = obj1.value;
        var obj2Value = obj2.value;
        if (obj1.type == "var") {
            if (obj1.variable)
                obj1Value = this._getVariableValue(obj1.variable);
        }
        if (obj2.type == "var") {
            if (obj2.variable)
                obj2Value = this._getVariableValue(obj2.variable);
        }

        var value: boolean = false;
        if (eqOpt) {
            value = obj2Value.value >= obj1Value.value;
        } else {
            value = obj2Value.value > obj1Value.value;
        }

        const res: Value = {
            type: "number",
            value: value ? 1 : 0,
        };
        this.stack.push({
            type: res.type,
            value: res,
            variable: undefined,
        });
    }

    _smallerThenExecute(eqOpt: boolean): void {
        var obj1 = this.stack.pop();
        var obj2 = this.stack.pop();

        if (
            !this._checkArithmeticObj(obj1, true) ||
            !this._checkArithmeticObj(obj2, true)
        ) {
            Logger.error("semantic error. can't comparison undefined.");
            throw new Error("semantic error. can't comparison undefined.");
        }

        var obj1Value = obj1.value;
        var obj2Value = obj2.value;
        if (obj1.type == "var") {
            if (obj1.variable)
                obj1Value = this._getVariableValue(obj1.variable);
        }
        if (obj2.type == "var") {
            if (obj2.variable)
                obj2Value = this._getVariableValue(obj2.variable);
        }

        var value: boolean = false;
        if (eqOpt) {
            value = obj2Value.value <= obj1Value.value;
        } else {
            value = obj2Value.value < obj1Value.value;
        }

        const res: Value = {
            type: "number",
            value: value ? 1 : 0,
        };
        this.stack.push({
            type: res.type,
            value: res,
            variable: undefined,
        });
    }

    _equalExecute(notOpt: boolean): void {
        var obj1 = this.stack.pop();
        var obj2 = this.stack.pop();

        if (
            !this._checkArithmeticObj(obj1, true) ||
            !this._checkArithmeticObj(obj2, true)
        ) {
            Logger.error("semantic error. can't comparison undefined.");
            throw new Error("semantic error. can't comparison undefined.");
        }

        var obj1Value = obj1.value;
        var obj2Value = obj2.value;
        if (obj1.type == "var") {
            if (obj1.variable)
                obj1Value = this._getVariableValue(obj1.variable);
        }
        if (obj2.type == "var") {
            if (obj2.variable)
                obj2Value = this._getVariableValue(obj2.variable);
        }

        var value: boolean = false;
        if (notOpt) {
            value = obj2Value.value != obj1Value.value;
        } else {
            value = obj2Value.value == obj1Value.value;
        }

        const res: Value = {
            type: "number",
            value: value ? 1 : 0,
        };
        this.stack.push({
            type: res.type,
            value: res,
            variable: undefined,
        });
    }

    _andExecute(): void {
        var obj1 = this.stack.pop();
        var obj2 = this.stack.pop();

        if (
            !this._checkArithmeticObj(obj1, false) ||
            !this._checkArithmeticObj(obj2, false)
        ) {
            Logger.error("semantic error. can't AND comparison undefined.");
            throw new Error("semantic error. can't AND comparison undefined.");
        }

        var obj1Value = obj1.value;
        var obj2Value = obj2.value;
        if (obj1Value.type != "number" || obj2Value.type != "number") {
            Logger.error(
                "semantic error. can't AND comparison no number value"
            );
            throw new Error(
                "semantic error. can't AND comparison no number value"
            );
        }

        let obj1Bool = obj1Value.value == 0 ? false : true;
        let obj2Bool = obj2Value.value == 0 ? false : true;

        let value = obj1Bool && obj2Bool;

        const res: Value = {
            type: "number",
            value: value ? 1 : 0,
        };
        this.stack.push({
            type: res.type,
            value: res,
            variable: undefined,
        });
    }

    _orExecute(): void {
        var obj1 = this.stack.pop();
        var obj2 = this.stack.pop();

        if (
            !this._checkArithmeticObj(obj1, false) ||
            !this._checkArithmeticObj(obj2, false)
        ) {
            Logger.error("semantic error. can't OR comparison undefined.");
            throw new Error("semantic error. can't OR comparison undefined.");
        }

        var obj1Value = obj1.value;
        var obj2Value = obj2.value;
        if (obj1Value.type != "number" || obj2Value.type != "number") {
            Logger.error("semantic error. can't OR comparison no number value");
            throw new Error(
                "semantic error. can't OR comparison no number value"
            );
        }

        let obj1Bool = obj1Value.value == 0 ? false : true;
        let obj2Bool = obj2Value.value == 0 ? false : true;

        let value = obj1Bool || obj2Bool;

        const res: Value = {
            type: "number",
            value: value ? 1 : 0,
        };
        this.stack.push({
            type: res.type,
            value: res,
            variable: undefined,
        });
    }

    _notExpression(): void {
        var obj = this.stack.pop();
        if (!this._checkArithmeticObj(obj, false)) {
            Logger.error("semantic error. can't NOT comparison undefined.");
            throw new Error("semantic error. can't NOT comparison undefined.");
        }
        var objValue = obj.value;
        if (objValue.type != "number") {
            Logger.error("semantic error. can't NOT comparison undefined.");
            throw new Error("semantic error. can't NOT comparison undefined.");
        }
        objValue.value = objValue.value != 0 ? 0 : 1;

        this.stack.push(obj);
    }

    _assignExecute(): void {
        var obj1 = this.stack.pop();
        var obj2 = this.stack.pop();

        if (obj2.type != "var") {
            Logger.error("can't assgin value to no variable");
            throw new Error("can't assgin value to no variable");
        }
        var objValue = obj1.value;
        if (obj1.type == "var") {
            objValue = this.variables[obj1.variable.name];
        }

        var variable = obj2.variable;
        var target = this.variables[variable.name];
        if (target == undefined || variable.member == undefined) {
            this.variables[variable.name] = objValue;
        } else {
            target = target.value;

            while (variable.member != undefined) {
                if (target[variable.member.name] == undefined) {
                    target[variable.member.name] = {};
                }
                if (variable.member.member == undefined) {
                    target[variable.member.name] = objValue.value;
                    break;
                }
                if (typeof target[variable.member.name] != "object") {
                    target[variable.member.name] = {};
                }
                target = target[variable.member.name];
                variable = variable.member;
            }
        }
        if (this.stack.length > 0) {
            this.stack.push(obj1);
        }
    }

    _semantic(syntax: SyntaxObject): void {
        const type = syntax.type;

        switch (type) {
            case "+":
                this._semantic(syntax.left);
                this._semantic(syntax.right);
                this._addExecute();
                break;
            case "-":
                this._semantic(syntax.left);
                this._semantic(syntax.right);
                this._subExecute();
                break;
            case "*":
                this._semantic(syntax.left);
                this._semantic(syntax.right);
                this._mulExecute();
                break;
            case "/":
                this._semantic(syntax.left);
                this._semantic(syntax.right);
                this._divExecute();
                break;
            case ">":
                this._semantic(syntax.left);
                this._semantic(syntax.right);
                this._largerThenExecute(false);
                break;
            case ">=":
                this._semantic(syntax.left);
                this._semantic(syntax.right);
                this._largerThenExecute(true);
                break;
            case "<":
                this._semantic(syntax.left);
                this._semantic(syntax.right);
                this._smallerThenExecute(false);
                break;
            case "<=":
                this._semantic(syntax.left);
                this._semantic(syntax.right);
                this._smallerThenExecute(true);
                break;
            case "==":
                this._semantic(syntax.left);
                this._semantic(syntax.right);
                this._equalExecute(false);
                break;
            case "!=":
                this._semantic(syntax.left);
                this._semantic(syntax.right);
                this._equalExecute(true);
                break;
            case "!":
                this._semantic(syntax.right);
                this._notExpression();
                break;
            case "&":
                this._semantic(syntax.left);
                this._semantic(syntax.right);
                this._addExecute();
                break;
            case "|":
                this._semantic(syntax.left);
                this._semantic(syntax.right);
                this._orExecute();
                break;
            case "=":
                this._semantic(syntax.left);
                this._semantic(syntax.right);
                this._assignExecute();
                break;
            case "var":
                let name = syntax.variable?.name;
                if (name == undefined) {
                    Logger.error("no variable name error");
                    throw new Error("no variable name error");
                }
                if (!(name in this.variables)) {
                    this.variables[name] = undefined;
                }
                this.stack.push({
                    type: "var",
                    value: undefined,
                    variable: syntax.variable,
                });
                break;
            case "string":
                let str = this._convertVariableInStr(syntax.value as string);
                this.stack.push({
                    type: "string",
                    value: {
                        type: "string",
                        value: str,
                    },
                    variable: undefined,
                });
                break;
            case "number":
                let num = syntax.value;
                this.stack.push({
                    type: "number",
                    value: {
                        type: "number",
                        value: num,
                    },
                    variable: undefined,
                });
                break;
            case "json":
                let jsonStr = this._convertVariableInStr(
                    syntax.value as string
                );
                var json = this._strToJson(jsonStr);
                this.stack.push({
                    type: "json",
                    value: {
                        type: "json",
                        value: json,
                    },
                    variable: undefined,
                });
                break;
            default:
                break;
        }
    }

    _expression(expr: ExpressionObject): void {
        const syntax = expr.syntax;
        this._semantic(syntax);
    }

    _output(syntax: OutputObject): void {
        var value = syntax.value;
        var str = this._convertVariableInStr(value);
        console.log(str);
    }

    _outputHttpResponse(
        method: string,
        url: string,
        httpResObj: HttpResponseObject
    ): void {
        if (!this.mode.silent) {
            console.log("%s %s", method, url);
            console.log(JSON.stringify(httpResObj, null, 2));
        }
    }

    async _webAPIRequest(syntax: HttpObject): Promise<void> {
        const reqestheaders: Array<HttpHeader> = [];
        if (syntax.headers != undefined) {
            for (var header of syntax.headers) {
                const value = this._convertVariableInStr(header.value);
                reqestheaders.push({ key: header.key, value: value });
            }
        }
        var parameterList: Array<string> = [];
        if (syntax.parameters != undefined) {
            for (var param of syntax.parameters) {
                const value = this._convertVariableInStr(param);
                parameterList.push(value);
            }
        }
        var body = undefined;
        if (syntax.body != undefined) {
            if (syntax.body.type == "string") {
                const value = this._convertVariableInStr(syntax.body.value);
                body = value;
            } else {
                const jsonStr = this._convertVariableInStr(syntax.body.value);
                const json = JSON.parse(jsonStr);
                body = JSON.stringify(json);
            }
        }
        const url = this._convertVariableInStr(syntax.url);
        const res = await HttpReq(
            syntax.method,
            url,
            reqestheaders,
            parameterList,
            body
        );
        const httpResObj: HttpResponseObject = {
            url: res.url,
            status: res.status,
            headers: {},
            bodyType: "string",
            body: undefined,
        };
        const headers = res.headers;
        headers.forEach((value, key) => {
            httpResObj.headers[key] = value;
        });

        const contentType = res.headers.get("content-type");
        if (contentType.includes("application/json")) {
            const body = await res.json();
            httpResObj.body = body;
            httpResObj.bodyType = "json";
        } else {
            const text = await res.text();
            httpResObj.body = text;
            httpResObj.bodyType = "string";
        }
        this._outputHttpResponse(syntax.method, url, httpResObj);
        if (syntax.bind != undefined) {
            const varName = syntax.bind;
            this.variables[varName] = { type: "json", value: httpResObj };
        }
    }

    async _ifExecute(syntax: ControleObject): Promise<void> {
        if (syntax.cond == undefined) {
            return;
        }
        this._semantic(syntax.cond);
        const res = this.stack.pop();
        if (res.type == "number" && res.value.value != 0) {
            await this._run(syntax.syntaxList, false);
        }
    }

    async _whileExecute(syntax: ControleObject): Promise<void> {
        if (syntax.cond == undefined) {
            return;
        }

        while (1) {
            this._semantic(syntax.cond);
            const res = this.stack.pop();
            if (res.type != "number" || res.value.value == 0) {
                break;
            }
            await this._run(syntax.syntaxList, false);
        }
    }

    async _sleepExecute(syntax: ControleObject): Promise<void> {
        if (syntax.cond == undefined) {
            return;
        }
        this._semantic(syntax.cond);
        const res = this.stack.pop();
        if (res.type == "number" && res.value != undefined) {
            let value = res.value.value;
            if (value > 0) {
                await setTimeout(value);
            }
        }
    }

    async _command(line: number): Promise<void> {
        console.log("execute line %d", line);
        while (1) {
            const cmd = await keyInput(
                'press command(enter: next step, "run": run script, "var": display vairables, "stop": stop script) :'
            );
            if (cmd == "run") {
                this.mode.step = false;
                break;
            }
            if (cmd == "stop") {
                this.stop = true;
                break;
            }
            if (cmd == "var") {
                console.log("%o", this.variables);
                continue;
            }
            break;
        }
    }

    async _run(syntaxList: Syntax[], isRefreshStack: boolean): Promise<void> {
        for (let syntax of syntaxList) {
            if (isRefreshStack) {
                this.stack.length = 0;
            }
            if (this.stop) {
                break;
            }
            switch (syntax.type) {
                case "output":
                    this._output(syntax as OutputObject);
                    break;
                case "http":
                    await this._webAPIRequest(syntax as HttpObject);
                    break;
                case "if":
                    await this._ifExecute(syntax as ControleObject);
                    break;
                case "while":
                    await this._whileExecute(syntax as ControleObject);
                    break;
                case "sleep":
                    await this._sleepExecute(syntax as ControleObject);
                    break;
                default:
                    this._expression(syntax as ExpressionObject);
                    break;
            }
            if (this.mode.step) {
                await this._command(syntax.line);
            }
            if (this.mode.verbose) {
                console.log("==");
                console.log("%o", this.variables);
                console.log("--");
            }
        }
    }

    async run(syntaxList: Syntax[]): Promise<void> {
        try {
            await this._run(syntaxList, true);
        } catch (e) {
            Logger.error("script stopped (%s)", e.toString());
            throw e;
        }
    }
}
