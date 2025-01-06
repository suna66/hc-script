import { HttpHeader } from "./types";
import Logger from "./log";

export async function HttpReq(
    method: string,
    url: string,
    headerList: HttpHeader[] | undefined,
    parameterList: string[] | undefined,
    body: string | undefined
): Promise<Response> | undefined {
    const headers = new Headers();
    let param = "";
    if (parameterList != undefined) {
        for (var p of parameterList) {
            if (param.length > 0) {
                param += "&";
            }
            param += p;
        }
    }
    let fixedURL = url;
    if (param.length > 0) {
        fixedURL = fixedURL + "?" + param;
    }
    if (headerList != undefined) {
        for (let header of headerList) {
            headers.append(header.key, header.value);
        }
    }
    try {
        const res = await fetch(fixedURL, {
            method: method,
            headers: headers,
            body: body == "" ? undefined : body,
        });

        return res;
    } catch (e) {
        Logger.error("http request error(%s)", e.toString());
        throw e;
    }

    return undefined;
}
