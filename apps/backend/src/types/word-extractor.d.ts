declare module "word-extractor" {
    interface WordDocument {
        getBody(): string;
        getFootnotes(): string;
        getEndnotes(): string;
        getHeaders(): string;
        getFooters(): string;
    }

    class WordExtractor {
        extract(input: Buffer | string): Promise<WordDocument>;
    }

    export = WordExtractor;
}
