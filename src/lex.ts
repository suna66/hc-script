export type Token = string | null | undefined;

export class Lex {
    sentence: string;
    text: string | undefined;
    line: number;
    token: Token;

    constructor(_sentence: string) {
        this.sentence = _sentence;
        this.text = undefined;
        this.line = 1;
        this.token = undefined;
    }

    next(): Token {
        while (1) {
            var c: Token = this.sentence[0];
            if (c === undefined || c === null) {
                this.token = null;
                return null;
            }
            this.sentence = this.sentence.slice(1);
            switch (c) {
                case " ":
                case "\r":
                case "\t":
                    continue;
                case "\n":
                    this.line++;
                    this.token = c;
                    return c;
                case "P":
                    if (this.sentence.startsWith("OST")) {
                        this.sentence = this.sentence.slice(3);
                        this.token = "POST";
                        return this.token;
                    }
                    if (this.sentence.startsWith("UT")) {
                        this.sentence = this.sentence.slice(2);
                        this.token = "PUT";
                        return this.token;
                    }
                    if (this.sentence.startsWith("ATCH")) {
                        this.sentence = this.sentence.slice(4);
                        this.token = "PATCH";
                        return this.token;
                    }
                    break;
                case "G":
                    if (this.sentence.startsWith("ET")) {
                        this.sentence = this.sentence.slice(2);
                        this.token = "GET";
                        return this.token;
                    }
                    break;
                case "D":
                    if (this.sentence.startsWith("ELETE")) {
                        this.sentence = this.sentence.slice(5);
                        this.token = "DELETE";
                        return this.token;
                    }
                    break;
                case "i":
                    if (this.sentence.startsWith("f")) {
                        this.sentence = this.sentence.slice(1);
                        this.token = "IF";
                        return this.token;
                    }
                    break;
                case "w":
                    if (this.sentence.startsWith("hile")) {
                        this.sentence = this.sentence.slice(4);
                        this.token = "WHILE";
                        return this.token;
                    }
                    break;
                case "e":
                    if (this.sentence.startsWith("nd")) {
                        this.sentence = this.sentence.slice(2);
                        this.token = "END";
                        return this.token;
                    }
                    break;
                case "s":
                    if (this.sentence.startsWith("leep")) {
                        this.sentence = this.sentence.slice(4);
                        this.token = "sleep";
                        return this.token;
                    }
                    break;
                case "=":
                    if (this.sentence[0] == "=") {
                        this.sentence = this.sentence.slice(1);
                        this.token = "==";
                        return this.token;
                    }
                    break;
                case ">":
                    if (this.sentence[0] == "=") {
                        this.sentence = this.sentence.slice(1);
                        this.token = ">=";
                        return this.token;
                    }
                    break;
                case "<":
                    if (this.sentence[0] == "=") {
                        this.sentence = this.sentence.slice(1);
                        this.token = "<=";
                        return this.token;
                    }
                    break;
                case "!":
                    if (this.sentence[0] == "=") {
                        this.sentence = this.sentence.slice(1);
                        this.token = "!=";
                        return this.token;
                    }
                    break;
                case "&":
                case "|":
                    if (this.sentence[0] == c) {
                        this.sentence = this.sentence.slice(1);
                    }
                    this.token = c;
                    return this.token;
                    break;
                case '"':
                    var str: string = "";
                    var index: number = 0;
                    while (1) {
                        c = this.sentence[index++];
                        if (c == '"' || c == undefined || c == null) {
                            break;
                        }
                        if (c == "\n") {
                            this.line++;
                        }
                        str += c;
                    }
                    this.sentence = this.sentence.slice(index);
                    this.text = str;
                    this.token = "string";
                    return this.token;
                case "{":
                    var str: string = c;
                    var index: number = 0;
                    var closeNum: number = 1;
                    while (1) {
                        c = this.sentence[index++];
                        if (c == undefined || c == null) {
                            break;
                        }
                        if (c == "{") {
                            closeNum++;
                        }
                        if (c == "}") {
                            closeNum--;
                        }
                        if (c == "\n") {
                            this.line++;
                        }
                        str += c;
                        if (closeNum == 0) {
                            break;
                        }
                    }
                    this.sentence = this.sentence.slice(index);
                    this.text = str;
                    this.token = "json";
                    return this.token;
                case "#":
                    var index: number = 0;
                    while (1) {
                        c = this.sentence[index++];
                        if (c == "\n" || c == undefined || c == null) {
                            this.line++;
                            break;
                        }
                    }
                    this.sentence = this.sentence.slice(index);
                    continue;
                default:
                    break;
            }
            if (c >= "0" && c <= "9") {
                var str: string = c;
                var index: number = 0;
                var type = "int";
                while (1) {
                    c = this.sentence[index++];
                    if (!((c >= "0" && c <= "9") || c == ".")) {
                        break;
                    }
                    if (c == ".") {
                        if (type == "number") {
                            console.error(
                                "lex error(%d): %s",
                                this.line,
                                "invalid number"
                            );
                            return null;
                        }
                        type = "number";
                    }
                    str += c;
                }
                this.sentence = this.sentence.slice(index - 1);
                this.text = str;
                this.token = type;
                return this.token;
            }
            if ((c >= "a" && c <= "z") || (c >= "A" && c <= "Z") || c == "_") {
                var str: string = c;
                var index: number = 0;
                while (1) {
                    c = this.sentence[index++];
                    if (
                        !(
                            (c >= "a" && c <= "z") ||
                            (c >= "A" && c <= "Z") ||
                            (c >= "0" && c <= "9") ||
                            c == "_"
                        )
                    ) {
                        break;
                    }
                    str += c;
                }
                this.sentence = this.sentence.slice(index - 1);
                this.text = str;
                this.token = "id";
                return this.token;
            }
            this.token = c;
            return c;
        }
        return null;
    }

    getLine(): number {
        return this.line;
    }

    getText(): string | undefined {
        return this.text;
    }

    getToken(): Token {
        return this.token;
    }
}
