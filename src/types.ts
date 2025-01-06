export type Variable = {
    name: string;
    member: Variable | undefined;
};

export type SyntaxObject = {
    type: string;
    variable: Variable | undefined;
    value: string | number | undefined;
    left: SyntaxObject | undefined;
    right: SyntaxObject | undefined;
};

export type OutputObject = {
    type: string;
    value: string;
};

export type HttpHeader = {
    key: string;
    value: string;
};

export type HttpBody = {
    type: string;
    value: string;
};

export type HttpObject = {
    type: string;
    method: string;
    url: string;
    headers: HttpHeader[] | undefined;
    parameters: string[] | undefined;
    body: HttpBody | undefined;
    bind: string | undefined;
};

export type ControleObject = {
    type: string;
    cond: SyntaxObject;
    syntaxList: Syntax[] | undefined;
};

export type NoneObject = {
    type: string;
};

export type Syntax =
    | (OutputObject | SyntaxObject | HttpObject | ControleObject | NoneObject)
    | undefined;

export type HttpResponseObject = {
    url: string;
    status: number;
    headers: { [key: string]: string };
    bodyType: string;
    body: string | object | undefined;
};
