"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const orderFlow_1 = require("./orderFlow");
const util_1 = require("../util");
const parse_1 = require("./parse");
async function POST(req) {
    const headerError = await (0, util_1.validateNextRequest)(req, (0, util_1.getSafeSaltNonce)());
    if (headerError)
        return headerError;
    try {
        const parsedRequest = await (0, parse_1.parseQuoteRequest)(req, await (0, util_1.getTokenMap)(), (0, util_1.getZerionKey)());
        console.log("POST Request for quote:", parsedRequest);
        const orderData = await (0, orderFlow_1.orderRequestFlow)(parsedRequest);
        console.log("Responding with", orderData);
        return server_1.NextResponse.json(orderData, { status: 200 });
    }
    catch (e) {
        const message = JSON.stringify(e);
        console.error(message);
        return server_1.NextResponse.json({ error: message }, { status: 400 });
    }
}
