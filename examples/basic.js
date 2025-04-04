import NetworkReceiptPrinter from "../src/main.js";
import ReceiptPrinterEncoder from "@point-of-sale/receipt-printer-encoder";
import getPixels from 'get-pixels';

let pixels = await new Promise(resolve => {
    getPixels('image.png', (err, pixels) => {
        resolve(pixels);
    });
});


const printer = new NetworkReceiptPrinter({
    host: '192.168.1.93',
    port: 9100
});

const encoder = new ReceiptPrinterEncoder({
    language: 'star-line',
});

printer.addEventListener('error', (e) => {
    console.error('Connection error', e);
});

printer.addEventListener('timeout', (e) => {
    console.error('Connection timed out');
});

printer.addEventListener('connected', async () => {
    console.log('Connected to printer');

    let commands = encoder
        .initialize()
        .text('Hello, world!')
        .newline()
        .image(pixels, 320, 320, 'atkinson')
        .newline()
        .cut()
        .encode();

    await printer.print(commands);
    await printer.disconnect();
});

printer.addEventListener('disconnected', () => {
    console.log('Disconnected from printer');
});

printer.connect();
