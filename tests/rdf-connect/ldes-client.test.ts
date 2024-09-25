import path from "path";
import { describe, test, expect, beforeAll, afterAll } from "vitest";
import { SimpleStream } from "@rdfc/js-runner";
import { fastify, FastifyInstance } from "fastify";
import { fastifyStatic } from "@fastify/static";
import { Parser } from "n3";
import { RdfStore } from "rdf-stores";
import { DataFactory } from "rdf-data-factory";
import { processor } from "../../lib/client";
import { createUriAndTermNamespace, RDF, SDS } from "@treecg/types";

const df = new DataFactory();

describe("Functional tests for the js:LdesClient RDF-Connect processor", () => {

    const LDES = "http://localhost:3000/mock-ldes.ttl";
    const ATYPICAL_LDES = "http://localhost:3000/mock-ldes-atypical.ttl";
    const EX = createUriAndTermNamespace("http://example.org/",
        "Clazz1",
        "Clazz2",
        "modified",
        "isVersionOf",
        "prop1"
    );
    let server: FastifyInstance;

    beforeAll(async () => {
        // Setup mock http server
        try {
            server = fastify();
            server.register(fastifyStatic, {
                root: path.join(__dirname, "../data/mock-ldes"),
            });
            await server.listen({ port: 3000 });
            console.log(`Mock server listening on ${server.addresses()[0].port}`);
        } catch (err) {
            server.log.error(err);
            process.exit(1);
        }
    });

    afterAll(async () => {
        await server.close();
    });

    test("Fetching an LDES unordered and no filters to get all members", async () => {
        const outputStream = new SimpleStream<string>();

        let count = 0;
        outputStream.data((record) => {
            // Check SDS metadata is present
            expect(record.indexOf(SDS.stream)).toBeGreaterThanOrEqual(0);
            expect(record.indexOf(SDS.payload)).toBeGreaterThanOrEqual(0);
            count++;
        });

        // Setup client
        const exec = await processor(
            outputStream,
            LDES,
            undefined,
            undefined,
            "none",
            false,
            undefined,
            undefined,
            false,
            undefined,
            false,
            false,
            undefined,
            undefined,
            false,
            false
        );

        // Run client
        await exec();
        // Expect all members
        expect(count).toBe(12);
    });

    test("Fetching an atypical LDES unordered and no filters to get all members", async () => {
        const outputStream = new SimpleStream<string>();

        let count = 0;
        outputStream.data((record) => {
            // Check SDS metadata is present
            expect(record.indexOf(SDS.stream)).toBeGreaterThanOrEqual(0);
            expect(record.indexOf(SDS.payload)).toBeGreaterThanOrEqual(0);
            count++;
        });

        // Setup client
        const exec = await processor(
            outputStream,
            ATYPICAL_LDES,
            undefined,
            undefined,
            "none",
            false,
            undefined,
            undefined,
            false,
            undefined,
            false,
            false,
            undefined,
            undefined,
            false,
            false
        );

        // Run client
        await exec();
        // Expect all members
        expect(count).toBe(12);
    });

    test("Fetching an LDES unordered and with after filter that gets no members", async () => {
        const outputStream = new SimpleStream<string>();

        let count = 0;
        outputStream.data(() => {
            count++;
        });

        // Setup client
        const exec = await processor(
            outputStream,
            LDES,
            undefined,
            new Date("3024-03-09T15:00:00.000Z"),
            "none",
            false,
            undefined,
            undefined,
            false,
            undefined,
            false,
            false,
            undefined,
            undefined,
            false,
            false
        );

        // Run client
        await exec();
        // No members were expected
        expect(count).toBe(0);
    });

    test("Fetching an atypical LDES unordered and with after filter that gets no members", async () => {
        const outputStream = new SimpleStream<string>();

        let count = 0;
        outputStream.data(() => {
            count++;
        });

        // Setup client
        const exec = await processor(
            outputStream,
            ATYPICAL_LDES,
            undefined,
            new Date("3024-03-09T15:00:00.000Z"),
            "none",
            false,
            undefined,
            undefined,
            false,
            undefined,
            false,
            false,
            undefined,
            undefined,
            false,
            false
        );

        // Run client
        await exec();
        // No members were expected
        expect(count).toBe(0);
    });

    test("Fetching an LDES unordered and with before filter that gets no members", async () => {
        const outputStream = new SimpleStream<string>();

        let count = 0;
        outputStream.data(() => {
            count++;
        });

        // Setup client
        const exec = await processor(
            outputStream,
            LDES,
            new Date("1325-03-09T15:00:00.000Z"),
            undefined,
            "none",
            false,
            undefined,
            undefined,
            false,
            undefined,
            false,
            false,
            undefined,
            undefined,
            false,
            false
        );

        // Run client
        await exec();
        // No members were expected
        expect(count).toBe(0);
    });

    test("Fetching an atypical LDES unordered and with before filter that gets no members", async () => {
        const outputStream = new SimpleStream<string>();

        let count = 0;
        outputStream.data(() => {
            count++;
        });

        // Setup client
        const exec = await processor(
            outputStream,
            ATYPICAL_LDES,
            new Date("1325-03-09T15:00:00.000Z"),
            undefined,
            "none",
            false,
            undefined,
            undefined,
            false,
            undefined,
            false,
            false,
            undefined,
            undefined,
            false,
            false
        );

        // Run client
        await exec();
        // No members were expected
        expect(count).toBe(0);
    });

    test("Fetching an LDES unordered and with before and after filter", async () => {
        const outputStream = new SimpleStream<string>();

        let count = 0;
        outputStream.data(record => {
            // Check SDS metadata is present
            expect(record.indexOf(SDS.stream)).toBeGreaterThanOrEqual(0);
            expect(record.indexOf(SDS.payload)).toBeGreaterThanOrEqual(0);

            // Check timestamp property (ex:modified in this LDES)
            const store = RdfStore.createDefault();
            new Parser().parse(record).forEach(q => store.addQuad(q));
            const timestampQ = store.getQuads(null, EX.terms.modified)[0];
            expect(timestampQ).toBeDefined();
            // Check that member is within date constraints
            expect(new Date(timestampQ.object.value).getTime()).toBeGreaterThan(new Date("2024-07-14T08:30:00.000Z").getTime());
            expect(new Date(timestampQ.object.value).getTime()).toBeLessThan(new Date("2024-07-14T09:30:00.000Z").getTime());
            count++;
        });

        // Setup client
        const exec = await processor(
            outputStream,
            LDES,
            new Date("2024-07-14T09:30:00.000Z"),
            new Date("2024-07-14T08:30:00.000Z"),
            "none",
            false,
            undefined,
            undefined,
            false,
            undefined,
            false,
            false,
            undefined,
            undefined,
            false,
            false
        );

        // Run client
        await exec();
        // Check we got some members
        expect(count).toBe(3);
    });

    test("Fetching an atypical LDES unordered and with before and after filter", async () => {
        const outputStream = new SimpleStream<string>();

        let count = 0;
        outputStream.data(record => {
            // Check SDS metadata is present
            expect(record.indexOf(SDS.stream)).toBeGreaterThanOrEqual(0);
            expect(record.indexOf(SDS.payload)).toBeGreaterThanOrEqual(0);

            // Check timestamp property (ex:modified in this LDES)
            const store = RdfStore.createDefault();
            new Parser().parse(record).forEach(q => store.addQuad(q));
            const timestampQ = store.getQuads(null, EX.terms.modified)[0];
            expect(timestampQ).toBeDefined();
            // Check that member is within date constraints
            expect(new Date(timestampQ.object.value).getTime()).toBeGreaterThan(new Date("2024-09-18T09:00:00.000Z").getTime());
            expect(new Date(timestampQ.object.value).getTime()).toBeLessThan(new Date("2024-09-18T10:53:00.000Z").getTime());
            count++;
        });

        // Setup client
        const exec = await processor(
            outputStream,
            ATYPICAL_LDES,
            new Date("2024-09-18T10:53:00.000Z"),
            new Date("2024-09-18T09:00:00.000Z"),
            "none",
            false,
            undefined,
            undefined,
            false,
            undefined,
            false,
            false,
            undefined,
            undefined,
            false,
            false
        );

        // Run client
        await exec();
        // Check we got some members
        expect(count).toBe(10);
    });

    test("Fetching an LDES in ascending order and with before and after filters", async () => {
        const outputStream = new SimpleStream<string>();

        let count = 0;
        const timestamps: number[] = [];

        outputStream.data(record => {
            expect(record.indexOf(SDS.stream)).toBeGreaterThanOrEqual(0);
            expect(record.indexOf(SDS.payload)).toBeGreaterThanOrEqual(0);

            // Extract timestamp property (ex:modified in this LDES)
            const store = RdfStore.createDefault();
            new Parser().parse(record).forEach(q => store.addQuad(q));
            const timestampQ = store.getQuads(null, EX.terms.modified)[0];
            expect(timestampQ).toBeDefined();
            // Check that member is within date constraints
            expect(new Date(timestampQ.object.value).getTime()).toBeGreaterThan(new Date("2024-07-14T09:00:00.000Z").getTime());
            expect(new Date(timestampQ.object.value).getTime()).toBeLessThan(new Date("2024-07-14T10:30:00.000Z").getTime());
            // Keep track of timestamp for checking order
            timestamps.push(new Date(timestampQ.object.value).getTime());
            count++;
        });

        // Setup client
        const exec = await processor(
            outputStream,
            LDES,
            new Date("2024-07-14T10:30:00.000Z"),
            new Date("2024-07-14T09:00:00.000Z"),
            "ascending",
            false,
            undefined,
            undefined,
            false,
            undefined,
            false,
            false,
            undefined,
            undefined,
            false,
            false
        );

        // Run client
        await exec();
        // Check we got some members
        expect(count).toBe(3);
        // Check result was ordered
        const isSorted = timestamps.every((v, i) => (i === 0 || v >= timestamps[i - 1]));
        expect(isSorted).toBeTruthy();
    });

    test("Fetching an atypical LDES in ascending order and with before and after filters", async () => {
        const outputStream = new SimpleStream<string>();

        let count = 0;
        const timestamps: number[] = [];

        outputStream.data(record => {
            expect(record.indexOf(SDS.stream)).toBeGreaterThanOrEqual(0);
            expect(record.indexOf(SDS.payload)).toBeGreaterThanOrEqual(0);

            // Extract timestamp property (ex:modified in this LDES)
            const store = RdfStore.createDefault();
            new Parser().parse(record).forEach(q => store.addQuad(q));
            const timestampQ = store.getQuads(null, EX.terms.modified)[0];
            expect(timestampQ).toBeDefined();
            // Check that member is within date constraints
            expect(new Date(timestampQ.object.value).getTime()).toBeGreaterThan(new Date("2024-09-18T09:00:00.000Z").getTime());
            expect(new Date(timestampQ.object.value).getTime()).toBeLessThan(new Date("2024-09-18T10:53:00.000Z").getTime());
            // Keep track of timestamp for checking order
            timestamps.push(new Date(timestampQ.object.value).getTime());
            count++;
        });

        // Setup client
        const exec = await processor(
            outputStream,
            ATYPICAL_LDES,
            new Date("2024-09-18T10:53:00.000Z"),
            new Date("2024-09-18T09:00:00.000Z"),
            "ascending",
            false,
            undefined,
            undefined,
            false,
            undefined,
            false,
            false,
            undefined,
            undefined,
            false,
            false
        );

        // Run client
        await exec();
        // Check we got some members
        expect(count).toBe(10);
        // Check result was ordered
        const isSorted = timestamps.every((v, i) => (i === 0 || v >= timestamps[i - 1]));
        expect(isSorted).toBeTruthy();
    });

    test("Fetching an LDES in descending order and with before and after filters", async () => {
        const outputStream = new SimpleStream<string>();

        let count = 0;
        const timestamps: number[] = [];

        outputStream.data(record => {
            expect(record.indexOf(SDS.stream)).toBeGreaterThanOrEqual(0);
            expect(record.indexOf(SDS.payload)).toBeGreaterThanOrEqual(0);

            // Extract timestamp property (ex:modified in this LDES)
            const store = RdfStore.createDefault();
            new Parser().parse(record).forEach(q => store.addQuad(q));
            const timestampQ = store.getQuads(null, EX.terms.modified)[0];
            expect(timestampQ).toBeDefined();
            expect(new Date(timestampQ.object.value).getTime()).toBeGreaterThan(new Date("2024-07-14T09:00:00.000Z").getTime());
            expect(new Date(timestampQ.object.value).getTime()).toBeLessThan(new Date("2024-07-14T10:30:00.000Z").getTime());
            // Keep track of timestamp for checking order
            timestamps.push(new Date(timestampQ.object.value).getTime());
            count++;
        });

        // Setup client
        const exec = await processor(
            outputStream,
            LDES,
            new Date("2024-07-14T10:30:00.000Z"),
            new Date("2024-07-14T09:00:00.000Z"),
            "descending",
            false,
            undefined,
            undefined,
            false,
            undefined,
            false,
            false,
            undefined,
            undefined,
            false,
            false
        );

        // Run client
        await exec();
        // Check we got some members
        expect(count).toBe(3);
        // Check result was ordered
        const isSorted = timestamps.every((v, i) => (i === 0 || v <= timestamps[i - 1]));
        expect(isSorted).toBeTruthy();
    });

    test("Fetching an atypical LDES in descending order and with before and after filters", async () => {
        const outputStream = new SimpleStream<string>();

        let count = 0;
        const timestamps: number[] = [];

        outputStream.data(record => {
            expect(record.indexOf(SDS.stream)).toBeGreaterThanOrEqual(0);
            expect(record.indexOf(SDS.payload)).toBeGreaterThanOrEqual(0);

            // Extract timestamp property (ex:modified in this LDES)
            const store = RdfStore.createDefault();
            new Parser().parse(record).forEach(q => store.addQuad(q));
            const timestampQ = store.getQuads(null, EX.terms.modified)[0];
            expect(timestampQ).toBeDefined();
            expect(new Date(timestampQ.object.value).getTime()).toBeGreaterThan(new Date("2024-09-18T09:00:00.000Z").getTime());
            expect(new Date(timestampQ.object.value).getTime()).toBeLessThan(new Date("2024-09-18T10:53:00.000Z").getTime());
            // Keep track of timestamp for checking order
            timestamps.push(new Date(timestampQ.object.value).getTime());
            count++;
        });

        // Setup client
        const exec = await processor(
            outputStream,
            ATYPICAL_LDES,
            new Date("2024-09-18T10:53:00.000Z"),
            new Date("2024-09-18T09:00:00.000Z"),
            "descending",
            false,
            undefined,
            undefined,
            false,
            undefined,
            false,
            false,
            undefined,
            undefined,
            false,
            false
        );

        // Run client
        await exec();
        // Check we got some members
        expect(count).toBe(10);
        // Check result was ordered
        const isSorted = timestamps.every((v, i) => (i === 0 || v <= timestamps[i - 1]));
        expect(isSorted).toBeTruthy();
    });

    test("Fetching an LDES unordered, with before and after filter and LDES original shape", async () => {
        const outputStream = new SimpleStream<string>();

        let count = 0;
        const observedClasses = new Map<string, boolean>([
            [EX.Clazz1, false],
            [EX.Clazz2, false]
        ]);
        outputStream.data(record => {
            expect(record.indexOf(SDS.stream)).toBeGreaterThanOrEqual(0);
            expect(record.indexOf(SDS.payload)).toBeGreaterThanOrEqual(0);

            // Extract timestamp property (ex:modified in this LDES)
            const store = RdfStore.createDefault();
            new Parser().parse(record).forEach(q => store.addQuad(q));
            const timestampQ = store.getQuads(null, EX.terms.modified)[0];
            expect(timestampQ).toBeDefined();
            expect(new Date(timestampQ.object.value).getTime()).toBeGreaterThan(new Date("2024-07-14T09:00:00.000Z").getTime());
            expect(new Date(timestampQ.object.value).getTime()).toBeLessThan(new Date("2024-07-14T10:30:00.000Z").getTime());

            // Check which classes we got
            for (const classSuffix of observedClasses.keys()) {
                if (record.includes(classSuffix)) {
                    observedClasses.set(classSuffix, true);
                }
            }
            count++;
        });

        // Setup client
        const exec = await processor(
            outputStream,
            LDES,
            new Date("2024-07-14T10:30:00.000Z"),
            new Date("2024-07-14T09:00:00.000Z"),
            "none",
            false,
            undefined,
            undefined,
            false,
            undefined,
            false,
            false,
            undefined,
            undefined,
            false,
            false
        );

        // Run client
        await exec();
        // Check we got some members
        expect(count).toBe(3);
        // Check we saw all expected classes
        expect(Array.from(observedClasses.values()).every(v => v === true)).toBeTruthy();
    });

    test("Fetching an atypical LDES unordered, with before and after filter and LDES original shape", async () => {
        const outputStream = new SimpleStream<string>();

        let count = 0;
        const observedClasses = new Map<string, boolean>([
            [EX.Clazz1, false],
            [EX.Clazz2, false]
        ]);
        outputStream.data(record => {
            expect(record.indexOf(SDS.stream)).toBeGreaterThanOrEqual(0);
            expect(record.indexOf(SDS.payload)).toBeGreaterThanOrEqual(0);

            // Extract timestamp property (ex:modified in this LDES)
            const store = RdfStore.createDefault();
            new Parser().parse(record).forEach(q => store.addQuad(q));
            const timestampQ = store.getQuads(null, EX.terms.modified)[0];
            expect(timestampQ).toBeDefined();
            expect(new Date(timestampQ.object.value).getTime()).toBeGreaterThan(new Date("2024-09-18T09:00:00.000Z").getTime());
            expect(new Date(timestampQ.object.value).getTime()).toBeLessThan(new Date("2024-09-18T10:53:00.000Z").getTime());

            // Check which classes we got
            for (const classSuffix of observedClasses.keys()) {
                if (record.includes(classSuffix)) {
                    observedClasses.set(classSuffix, true);
                }
            }
            count++;
        });

        // Setup client
        const exec = await processor(
            outputStream,
            ATYPICAL_LDES,
            new Date("2024-09-18T10:53:00.000Z"),
            new Date("2024-09-18T09:00:00.000Z"),
            "none",
            false,
            undefined,
            undefined,
            false,
            undefined,
            false,
            false,
            undefined,
            undefined,
            false,
            false
        );

        // Run client
        await exec();
        // Check we got some members
        expect(count).toBe(10);
        // Check we saw all expected classes
        expect(Array.from(observedClasses.values()).every(v => v === true)).toBeTruthy();
    });

    test("Fetching an LDES unordered, with before and after filter and overridden local shape", async () => {
        const outputStream = new SimpleStream<string>();

        let count = 0;
        const observedClasses = new Map<string, boolean>([[EX.Clazz1, false]]);

        outputStream.data(record => {
            expect(record.indexOf(SDS.stream)).toBeGreaterThanOrEqual(0);
            expect(record.indexOf(SDS.payload)).toBeGreaterThanOrEqual(0);

            const store = RdfStore.createDefault();
            new Parser().parse(record).forEach(q => store.addQuad(q));
            // Extract timestamp property (ex:modified in this LDES)
            const timestampQ = store.getQuads(null, EX.terms.modified)[0];
            expect(timestampQ).toBeDefined();
            expect(new Date(timestampQ.object.value).getTime()).toBeGreaterThan(new Date("2024-07-14T09:00:00.000Z").getTime());
            expect(new Date(timestampQ.object.value).getTime()).toBeLessThan(new Date("2024-07-14T10:30:00.000Z").getTime());
            
            // Check which classes we got
            for (const classSuffix of observedClasses.keys()) {
                if (record.includes(classSuffix)) {
                    observedClasses.set(classSuffix, true);
                }
            }

            // Check ex:Clazz2 instance was not extracted
            expect(store.getQuads(null, RDF.terms.type, df.namedNode(EX.Clazz2)).length).toBe(0);
            count++;
        });

        // Setup client
        const exec = await processor(
            outputStream,
            LDES,
            new Date("2024-07-14T10:30:00.000Z"),
            new Date("2024-07-14T09:00:00.000Z"),
            "none",
            false,
            undefined,
            "./tests/data/mock-ldes/partial-shape.ttl",
            false,
            undefined,
            false,
            false,
            undefined,
            undefined,
            false,
            false
        );

        // Run client
        await exec();
        // Check we got some members
        expect(count).toBe(3);
        // Check we saw all expected classes
        expect(Array.from(observedClasses.values()).every(v => v === true)).toBeTruthy();
    });

    test("Fetching an atypical LDES unordered, with before and after filter and overridden local shape", async () => {
        const outputStream = new SimpleStream<string>();

        let count = 0;
        const observedClasses = new Map<string, boolean>([[EX.Clazz1, false]]);

        outputStream.data(record => {
            expect(record.indexOf(SDS.stream)).toBeGreaterThanOrEqual(0);
            expect(record.indexOf(SDS.payload)).toBeGreaterThanOrEqual(0);

            const store = RdfStore.createDefault();
            new Parser().parse(record).forEach(q => store.addQuad(q));
            // Extract timestamp property (ex:modified in this LDES)
            const timestampQ = store.getQuads(null, EX.terms.modified)[0];
            expect(timestampQ).toBeDefined();
            expect(new Date(timestampQ.object.value).getTime()).toBeGreaterThan(new Date("2024-09-18T09:00:00.000Z").getTime());
            expect(new Date(timestampQ.object.value).getTime()).toBeLessThan(new Date("2024-09-18T10:53:00.000Z").getTime());
            
            // Check which classes we got
            for (const classSuffix of observedClasses.keys()) {
                if (record.includes(classSuffix)) {
                    observedClasses.set(classSuffix, true);
                }
            }

            // Check ex:Clazz2 instance was not extracted
            expect(store.getQuads(null, RDF.terms.type, df.namedNode(EX.Clazz2)).length).toBe(0);
            count++;
        });

        // Setup client
        const exec = await processor(
            outputStream,
            ATYPICAL_LDES,
            new Date("2024-09-18T10:53:00.000Z"),
            new Date("2024-09-18T09:00:00.000Z"),
            "none",
            false,
            undefined,
            "./tests/data/mock-ldes/partial-shape.ttl",
            false,
            undefined,
            false,
            false,
            undefined,
            undefined,
            false,
            false
        );

        // Run client
        await exec();
        // Check we got some members
        expect(count).toBe(10);
        // Check we saw all expected classes
        expect(Array.from(observedClasses.values()).every(v => v === true)).toBeTruthy();
    });

    test("Fetching an LDES unordered, with before and after filter and overridden remote shape", async () => {
        const outputStream = new SimpleStream<string>();

        let count = 0;
        const observedClasses = new Map<string, boolean>([
            [EX.Clazz1, false],
            [EX.Clazz2, false]
        ]);

        outputStream.data(record => {
            expect(record.indexOf(SDS.stream)).toBeGreaterThanOrEqual(0);
            expect(record.indexOf(SDS.payload)).toBeGreaterThanOrEqual(0);

            const store = RdfStore.createDefault();
            new Parser().parse(record).forEach(q => store.addQuad(q));

            // Extract timestamp property (ex:modified in this LDES)
            const timestampQ = store.getQuads(null, EX.terms.modified)[0];
            expect(timestampQ).toBeDefined();
            expect(new Date(timestampQ.object.value).getTime()).toBeGreaterThan(new Date("2024-07-14T09:00:00.000Z").getTime());
            expect(new Date(timestampQ.object.value).getTime()).toBeLessThan(new Date("2024-07-14T10:30:00.000Z").getTime());

            // Check which classes we got
            for (const classSuffix of observedClasses.keys()) {
                if (record.includes(classSuffix)) {
                    observedClasses.set(classSuffix, true);
                }
            }
            count++;
        });

        // Setup client
        const exec = await processor(
            outputStream,
            LDES,
            new Date("2024-07-14T10:30:00.000Z"),
            new Date("2024-07-14T09:00:00.000Z"),
            "none",
            false,
            undefined,
            "http://localhost:3000/full-shape.ttl",
            false,
            undefined,
            false,
            false,
            undefined,
            undefined,
            false,
            false
        );

        // Run client
        await exec();
        // Check we got some members
        expect(count).toBe(3);
        // Check we saw all expected classes
        expect(Array.from(observedClasses.values()).every(v => v === true)).toBeTruthy();
    });

    test("Fetching an atypical LDES unordered, with before and after filter and overridden remote shape", async () => {
        const outputStream = new SimpleStream<string>();

        let count = 0;
        const observedClasses = new Map<string, boolean>([
            [EX.Clazz1, false],
            [EX.Clazz2, false]
        ]);

        outputStream.data(record => {
            expect(record.indexOf(SDS.stream)).toBeGreaterThanOrEqual(0);
            expect(record.indexOf(SDS.payload)).toBeGreaterThanOrEqual(0);

            const store = RdfStore.createDefault();
            new Parser().parse(record).forEach(q => store.addQuad(q));

            // Extract timestamp property (ex:modified in this LDES)
            const timestampQ = store.getQuads(null, EX.terms.modified)[0];
            expect(timestampQ).toBeDefined();
            expect(new Date(timestampQ.object.value).getTime()).toBeGreaterThan(new Date("2024-09-18T09:00:00.000Z").getTime());
            expect(new Date(timestampQ.object.value).getTime()).toBeLessThan(new Date("2024-09-18T10:53:00.000Z").getTime());

            // Check which classes we got
            for (const classSuffix of observedClasses.keys()) {
                if (record.includes(classSuffix)) {
                    observedClasses.set(classSuffix, true);
                }
            }
            count++;
        });

        // Setup client
        const exec = await processor(
            outputStream,
            ATYPICAL_LDES,
            new Date("2024-09-18T10:53:00.000Z"),
            new Date("2024-09-18T09:00:00.000Z"),
            "none",
            false,
            undefined,
            "http://localhost:3000/full-shape.ttl",
            false,
            undefined,
            false,
            false,
            undefined,
            undefined,
            false,
            false
        );

        // Run client
        await exec();
        // Check we got some members
        expect(count).toBe(10);
        // Check we saw all expected classes
        expect(Array.from(observedClasses.values()).every(v => v === true)).toBeTruthy();
    });

    test("Fetching an LDES unordered, with before and after filters and no shape (defaults to CBD member extraction)", async () => {
        const outputStream = new SimpleStream<string>();

        let count = 0;
        const observedClasses = new Map<string, boolean>([[EX.Clazz1, false]]);

        outputStream.data(record => {
            expect(record.indexOf(SDS.stream)).toBeGreaterThanOrEqual(0);
            expect(record.indexOf(SDS.payload)).toBeGreaterThanOrEqual(0);

            const store = RdfStore.createDefault();
            new Parser().parse(record).forEach(q => store.addQuad(q));

            // Extract timestamp property (ex:modified in this LDES)
            const timestampQ = store.getQuads(null, EX.terms.modified)[0];
            expect(timestampQ).toBeDefined();
            expect(new Date(timestampQ.object.value).getTime()).toBeGreaterThan(new Date("2024-07-14T09:00:00.000Z").getTime());
            expect(new Date(timestampQ.object.value).getTime()).toBeLessThan(new Date("2024-07-14T10:30:00.000Z").getTime());

            // Check which classes we got
            for (const classSuffix of observedClasses.keys()) {
                if (record.includes(classSuffix)) {
                    observedClasses.set(classSuffix, true);
                }
            }

            // Check ex:Clazz2 instance was not extracted
            expect(store.getQuads(null, RDF.terms.type, df.namedNode(EX.Clazz2)).length).toBe(0);
            count++;
        });

        // Setup client
        const exec = await processor(
            outputStream,
            LDES,
            new Date("2024-07-14T10:30:00.000Z"),
            new Date("2024-07-14T09:00:00.000Z"),
            "none",
            false,
            undefined,
            undefined,
            true, // No shape
            undefined,
            false,
            false,
            undefined,
            undefined,
            false,
            false
        );

        // Run client
        await exec();
        // Check we got some members
        expect(count).toBe(3);
        // Check we saw all expected classes
        expect(Array.from(observedClasses.values()).every(v => v === true)).toBeTruthy();
    });

    test("Fetching an atypical LDES unordered, with before and after filters and no shape (defaults to CBD member extraction)", async () => {
        const outputStream = new SimpleStream<string>();

        let count = 0;
        const observedClasses = new Map<string, boolean>([[EX.Clazz1, false]]);

        outputStream.data(record => {
            expect(record.indexOf(SDS.stream)).toBeGreaterThanOrEqual(0);
            expect(record.indexOf(SDS.payload)).toBeGreaterThanOrEqual(0);

            const store = RdfStore.createDefault();
            new Parser().parse(record).forEach(q => store.addQuad(q));

            // Extract timestamp property (ex:modified in this LDES)
            const timestampQ = store.getQuads(null, EX.terms.modified)[0];
            expect(timestampQ).toBeDefined();
            expect(new Date(timestampQ.object.value).getTime()).toBeGreaterThan(new Date("2024-09-18T09:00:00.000Z").getTime());
            expect(new Date(timestampQ.object.value).getTime()).toBeLessThan(new Date("2024-09-18T10:53:00.000Z").getTime());

            // Check which classes we got
            for (const classSuffix of observedClasses.keys()) {
                if (record.includes(classSuffix)) {
                    observedClasses.set(classSuffix, true);
                }
            }

            // Check ex:Clazz2 instance was not extracted
            expect(store.getQuads(null, RDF.terms.type, df.namedNode(EX.Clazz2)).length).toBe(0);
            count++;
        });

        // Setup client
        const exec = await processor(
            outputStream,
            ATYPICAL_LDES,
            new Date("2024-09-18T10:53:00.000Z"),
            new Date("2024-09-18T09:00:00.000Z"),
            "none",
            false,
            undefined,
            undefined,
            true, // No shape
            undefined,
            false,
            false,
            undefined,
            undefined,
            false,
            false
        );

        // Run client
        await exec();
        // Check we got some members
        expect(count).toBe(10);
        // Check we saw all expected classes
        expect(Array.from(observedClasses.values()).every(v => v === true)).toBeTruthy();
    });

    test("Fetching an LDES in ascending order, with before and after filter and overridden remote shape", async () => {
        const outputStream = new SimpleStream<string>();

        let count = 0;
        const timestamps: number[] = [];
        const observedClasses = new Map<string, boolean>([
            [EX.Clazz1, false],
            [EX.Clazz2, false]
        ]);

        outputStream.data(record => {
            expect(record.indexOf(SDS.stream)).toBeGreaterThanOrEqual(0);
            expect(record.indexOf(SDS.payload)).toBeGreaterThanOrEqual(0);

            const store = RdfStore.createDefault();
            new Parser().parse(record).forEach(q => store.addQuad(q));

            // Check which classes we got
            for (const classSuffix of observedClasses.keys()) {
                if (record.includes(classSuffix)) {
                    observedClasses.set(classSuffix, true);
                }
            }

            // Extract timestamp property (ex:modified in this LDES)
            const timestampQ = store.getQuads(null, EX.terms.modified)[0];
            expect(timestampQ).toBeDefined();
            // Check that member is within date constraints
            expect(new Date(timestampQ.object.value).getTime()).toBeGreaterThan(new Date("2024-07-14T09:00:00.000Z").getTime());
            expect(new Date(timestampQ.object.value).getTime()).toBeLessThan(new Date("2024-07-14T10:30:00.000Z").getTime());
            // Keep track of timestamp for checking order
            timestamps.push(new Date(timestampQ.object.value).getTime());
            count++;
        });

        // Setup client
        const exec = await processor(
            outputStream,
            LDES,
            new Date("2024-07-14T10:30:00.000Z"),
            new Date("2024-07-14T09:00:00.000Z"),
            "ascending",
            false,
            undefined,
            "http://localhost:3000/full-shape.ttl",
            false,
            undefined,
            false,
            false,
            undefined,
            undefined,
            false,
            false
        );

        // Run client
        await exec();
        // Check we got some members
        expect(count).toBe(3);
        // Check we saw all expected classes
        expect(Array.from(observedClasses.values()).every(v => v === true)).toBeTruthy();
        // Check result was ordered
        const isSorted = timestamps.every((v, i) => (i === 0 || v >= timestamps[i - 1]));
        expect(isSorted).toBeTruthy();
    });

    test("Fetching an atypical LDES in ascending order, with before and after filter and overridden remote shape", async () => {
        const outputStream = new SimpleStream<string>();

        let count = 0;
        const timestamps: number[] = [];
        const observedClasses = new Map<string, boolean>([
            [EX.Clazz1, false],
            [EX.Clazz2, false]
        ]);

        outputStream.data(record => {
            expect(record.indexOf(SDS.stream)).toBeGreaterThanOrEqual(0);
            expect(record.indexOf(SDS.payload)).toBeGreaterThanOrEqual(0);

            const store = RdfStore.createDefault();
            new Parser().parse(record).forEach(q => store.addQuad(q));

            // Check which classes we got
            for (const classSuffix of observedClasses.keys()) {
                if (record.includes(classSuffix)) {
                    observedClasses.set(classSuffix, true);
                }
            }

            // Extract timestamp property (ex:modified in this LDES)
            const timestampQ = store.getQuads(null, EX.terms.modified)[0];
            expect(timestampQ).toBeDefined();
            // Check that member is within date constraints
            expect(new Date(timestampQ.object.value).getTime()).toBeGreaterThan(new Date("2024-09-18T09:00:00.000Z").getTime());
            expect(new Date(timestampQ.object.value).getTime()).toBeLessThan(new Date("2024-09-18T10:53:00.000Z").getTime());
            // Keep track of timestamp for checking order
            timestamps.push(new Date(timestampQ.object.value).getTime());
            count++;
        });

        // Setup client
        const exec = await processor(
            outputStream,
            ATYPICAL_LDES,
            new Date("2024-09-18T10:53:00.000Z"),
            new Date("2024-09-18T09:00:00.000Z"),
            "ascending",
            false,
            undefined,
            "http://localhost:3000/full-shape.ttl",
            false,
            undefined,
            false,
            false,
            undefined,
            undefined,
            false,
            false
        );

        // Run client
        await exec();
        // Check we got some members
        expect(count).toBe(10);
        // Check we saw all expected classes
        expect(Array.from(observedClasses.values()).every(v => v === true)).toBeTruthy();
        // Check result was ordered
        const isSorted = timestamps.every((v, i) => (i === 0 || v >= timestamps[i - 1]));
        expect(isSorted).toBeTruthy();
    });

    test("Fetching an LDES unordered and version materialized members", async () => {
        const outputStream = new SimpleStream<string>();

        let count = 0;
        const memberIds = new Set<string>();
        outputStream.data(record => {
            expect(record.indexOf(SDS.stream)).toBeGreaterThanOrEqual(0);
            expect(record.indexOf(SDS.payload)).toBeGreaterThanOrEqual(0);

            const store = RdfStore.createDefault();
            new Parser().parse(record).forEach(q => store.addQuad(q));

            // Keep track of member IDs
            memberIds.add(store.getQuads(null, SDS.terms.payload)[0].object.value);

            // Check the version property is not present
            expect(store.getQuads(null, df.namedNode(EX.isVersionOf)).length).toBe(0);

            count++;
        });

        // Setup client
        const exec = await processor(
            outputStream,
            LDES,
            undefined,
            undefined,
            "none",
            false,
            undefined,
            undefined,
            false,
            undefined,
            false,
            false,
            undefined,
            undefined,
            true, // Materialize members
            false
        );

        // Run client
        await exec();
        // Check we got all members
        expect(count).toBe(12);
        // Check we got all unique members
        expect(memberIds.size).toBe(6);
    });

    test("Fetching an atypical LDES unordered and version materialized members", async () => {
        const outputStream = new SimpleStream<string>();

        let count = 0;
        const memberIds = new Set<string>();
        outputStream.data(record => {
            expect(record.indexOf(SDS.stream)).toBeGreaterThanOrEqual(0);
            expect(record.indexOf(SDS.payload)).toBeGreaterThanOrEqual(0);

            const store = RdfStore.createDefault();
            new Parser().parse(record).forEach(q => store.addQuad(q));

            // Keep track of member IDs
            memberIds.add(store.getQuads(null, SDS.terms.payload)[0].object.value);

            // Check the version property is not present
            expect(store.getQuads(null, df.namedNode(EX.isVersionOf)).length).toBe(0);

            count++;
        });

        // Setup client
        const exec = await processor(
            outputStream,
            ATYPICAL_LDES,
            undefined,
            undefined,
            "none",
            false,
            undefined,
            undefined,
            false,
            undefined,
            false,
            false,
            undefined,
            undefined,
            true, // Materialize members
            false
        );

        // Run client
        await exec();
        // Check we got all members
        expect(count).toBe(12);
        // Check we got all unique members
        expect(memberIds.size).toBe(6);
    });

    test("Fetching an LDES in ascending order, with before and after filters, overriden local shape and version materialized members", async () => {
        const outputStream = new SimpleStream<string>();

        let count = 0;
        const timestamps: number[] = [];
        const observedClasses = new Map<string, boolean>([[EX.Clazz1, false]]);
        const memberIds = new Set<string>();
        
        outputStream.data(record => {
            expect(record.indexOf(SDS.stream)).toBeGreaterThanOrEqual(0);
            expect(record.indexOf(SDS.payload)).toBeGreaterThanOrEqual(0);

            const store = RdfStore.createDefault();
            new Parser().parse(record).forEach(q => store.addQuad(q));

            // Check which classes we got
            for (const classSuffix of observedClasses.keys()) {
                if (record.includes(classSuffix)) {
                    observedClasses.set(classSuffix, true);
                }
            }

            // Extract timestamp property (ex:modified in this LDES)
            const timestampQ = store.getQuads(null, EX.terms.modified)[0];
            expect(timestampQ).toBeDefined();
            // Check that member is within date constraints
            expect(new Date(timestampQ.object.value).getTime()).toBeGreaterThan(new Date("2024-07-14T09:00:00.000Z").getTime());
            expect(new Date(timestampQ.object.value).getTime()).toBeLessThan(new Date("2024-07-14T10:30:00.000Z").getTime());
            // Keep track of timestamp for checking order
            timestamps.push(new Date(timestampQ.object.value).getTime());

            // Keep track of member IDs
            memberIds.add(store.getQuads(null, SDS.terms.payload)[0].object.value);
            // Check the version property is not present
            expect(store.getQuads(null, df.namedNode(EX.isVersionOf)).length).toBe(0);

            count++;
        });

        // Setup client
        const exec = await processor(
            outputStream,
            LDES,
            new Date("2024-07-14T10:30:00.000Z"),
            new Date("2024-07-14T09:00:00.000Z"),
            "ascending",
            false,
            undefined,
            "./tests/data/mock-ldes/partial-shape.ttl",
            false,
            undefined,
            false,
            false,
            undefined,
            undefined,
            true, // Materialize members
            false
        );

        // Run client
        await exec();
        // Check we got some members
        expect(count).toBe(3);
        // Check we saw all expected classes
        expect(Array.from(observedClasses.values()).every(v => v === true)).toBeTruthy();
        // Check result was ordered
        const isSorted = timestamps.every((v, i) => (i === 0 || v >= timestamps[i - 1]));
        expect(isSorted).toBeTruthy();
        // Check we got all unique members
        expect(memberIds.size).toBe(3);
    });

    test("Fetching an atypical LDES in ascending order, with before and after filters, overriden local shape and version materialized members", async () => {
        const outputStream = new SimpleStream<string>();

        let count = 0;
        const timestamps: number[] = [];
        const observedClasses = new Map<string, boolean>([[EX.Clazz1, false]]);
        const memberIds = new Set<string>();
        
        outputStream.data(record => {
            expect(record.indexOf(SDS.stream)).toBeGreaterThanOrEqual(0);
            expect(record.indexOf(SDS.payload)).toBeGreaterThanOrEqual(0);

            const store = RdfStore.createDefault();
            new Parser().parse(record).forEach(q => store.addQuad(q));

            // Check which classes we got
            for (const classSuffix of observedClasses.keys()) {
                if (record.includes(classSuffix)) {
                    observedClasses.set(classSuffix, true);
                }
            }

            // Extract timestamp property (ex:modified in this LDES)
            const timestampQ = store.getQuads(null, EX.terms.modified)[0];
            expect(timestampQ).toBeDefined();
            // Check that member is within date constraints
            expect(new Date(timestampQ.object.value).getTime()).toBeGreaterThan(new Date("2024-09-18T09:00:00.000Z").getTime());
            expect(new Date(timestampQ.object.value).getTime()).toBeLessThan(new Date("2024-09-18T10:53:00.000Z").getTime());
            // Keep track of timestamp for checking order
            timestamps.push(new Date(timestampQ.object.value).getTime());

            // Keep track of member IDs
            memberIds.add(store.getQuads(null, SDS.terms.payload)[0].object.value);
            // Check the version property is not present
            expect(store.getQuads(null, df.namedNode(EX.isVersionOf)).length).toBe(0);

            count++;
        });

        // Setup client
        const exec = await processor(
            outputStream,
            ATYPICAL_LDES,
            new Date("2024-09-18T10:53:00.000Z"),
            new Date("2024-09-18T09:00:00.000Z"),
            "ascending",
            false,
            undefined,
            "./tests/data/mock-ldes/partial-shape.ttl",
            false,
            undefined,
            false,
            false,
            undefined,
            undefined,
            true, // Materialize members
            false
        );

        // Run client
        await exec();
        // Check we got some members
        expect(count).toBe(10);
        // Check we saw all expected classes
        expect(Array.from(observedClasses.values()).every(v => v === true)).toBeTruthy();
        // Check result was ordered
        const isSorted = timestamps.every((v, i) => (i === 0 || v >= timestamps[i - 1]));
        expect(isSorted).toBeTruthy();
        // Check we got all unique members
        expect(memberIds.size).toBe(6);
    });

    test("Fetching an LDES asking for only the last version of every member", async () => {
        const outputStream = new SimpleStream<string>();

        let count = 0;
        const memberIds = new Set<string>();

        outputStream.data(record => {
            expect(record.indexOf(SDS.stream)).toBeGreaterThanOrEqual(0);
            expect(record.indexOf(SDS.payload)).toBeGreaterThanOrEqual(0);

            // Extract canonical member ID and timestamp
            const store = RdfStore.createDefault();
            new Parser().parse(record).forEach(q => store.addQuad(q));
            const canonicalId = store.getQuads(null, EX.terms.isVersionOf)[0].object.value;
            // Check that member hasn't been seen before
            expect(memberIds.has(canonicalId)).toBeFalsy();

            memberIds.add(canonicalId);
            count++;
        });

        // Setup client
        const exec = await processor(
            outputStream,
            LDES,
            undefined,
            undefined,
            "none",
            false,
            undefined,
            undefined,
            false,
            undefined,
            false,
            false,
            undefined,
            undefined,
            false, 
            true // last version only
        );

        // Run client
        await exec();
        // Check we got some members
        expect(count).toBe(6);
    });

    test("Fetching an atypical LDES asking for only the last version of every member", async () => {
        const outputStream = new SimpleStream<string>();

        let count = 0;
        const memberIds = new Set<string>();

        outputStream.data(record => {
            expect(record.indexOf(SDS.stream)).toBeGreaterThanOrEqual(0);
            expect(record.indexOf(SDS.payload)).toBeGreaterThanOrEqual(0);

            // Extract canonical member ID and timestamp
            const store = RdfStore.createDefault();
            new Parser().parse(record).forEach(q => store.addQuad(q));
            const canonicalId = store.getQuads(null, EX.terms.isVersionOf)[0].object.value;
            // Check that member hasn't been seen before
            expect(memberIds.has(canonicalId)).toBeFalsy();

            memberIds.add(canonicalId);
            count++;
        });

        // Setup client
        const exec = await processor(
            outputStream,
            ATYPICAL_LDES,
            undefined,
            undefined,
            "none",
            false,
            undefined,
            undefined,
            false,
            undefined,
            false,
            false,
            undefined,
            undefined,
            false, 
            true // last version only
        );

        // Run client
        await exec();
        // Check we got some members
        expect(count).toBe(6);
    });

    test("Fetching an LDES with before and after filter, overriden remote shape, asking for only the last version of every member and versioned materialized", async () => {
        const outputStream = new SimpleStream<string>();

        let count = 0;
        const timestamps: number[] = [];
        const observedClasses = new Map<string, boolean>([
            [EX.Clazz1, false],
            [EX.Clazz2, false]
        ]);
        const memberIds = new Set<string>();

        outputStream.data(record => {
            expect(record.indexOf(SDS.stream)).toBeGreaterThanOrEqual(0);
            expect(record.indexOf(SDS.payload)).toBeGreaterThanOrEqual(0);

            const store = RdfStore.createDefault();
            new Parser().parse(record).forEach(q => store.addQuad(q));

            // Check which classes we got
            for (const classSuffix of observedClasses.keys()) {
                if (record.includes(classSuffix)) {
                    observedClasses.set(classSuffix, true);
                }
            }

            // Extract timestamp property (ex:modified in this LDES)
            const timestampQ = store.getQuads(null, EX.terms.modified)[0];
            expect(timestampQ).toBeDefined();
            // Check that member is within date constraints
            expect(new Date(timestampQ.object.value).getTime()).toBeGreaterThan(new Date("2024-07-14T09:00:00.000Z").getTime());
            expect(new Date(timestampQ.object.value).getTime()).toBeLessThan(new Date("2024-07-14T10:30:00.000Z").getTime());
            // Keep track of timestamp for checking order
            timestamps.push(new Date(timestampQ.object.value).getTime());
            // Keep track of member IDs
            const memberId = store.getQuads(null, SDS.terms.payload)[0].object.value;
            expect(memberIds.has(memberId)).toBeFalsy();
            memberIds.add(memberId);
            // Check the version property is not present
            expect(store.getQuads(null, df.namedNode(EX.isVersionOf)).length).toBe(0);
            count++;
        });

        // Setup client
        const exec = await processor(
            outputStream,
            LDES,
            new Date("2024-07-14T10:30:00.000Z"),
            new Date("2024-07-14T09:00:00.000Z"),
            "none",
            false,
            undefined,
            "http://localhost:3000/full-shape.ttl",
            false,
            undefined,
            false,
            false,
            undefined,
            undefined,
            true, // Materialized members
            true // Last version only
        );

        // Run client
        await exec();
        // Check we got some members
        expect(count).toBe(3);
        // Check result was ordered (in descending order due to last version only)
        const isSorted = timestamps.every((v, i) => (i === 0 || v <= timestamps[i - 1]));
        expect(isSorted).toBeTruthy();
        // Check we saw all expected classes
        expect(Array.from(observedClasses.values()).every(v => v === true)).toBeTruthy();
    });

    test("Fetching an atypical LDES with before and after filter, overriden remote shape, asking for only the last version of every member and versioned materialized", async () => {
        const outputStream = new SimpleStream<string>();

        let count = 0;
        const timestamps: number[] = [];
        const observedClasses = new Map<string, boolean>([
            [EX.Clazz1, false],
            [EX.Clazz2, false]
        ]);
        const memberIds = new Set<string>();

        outputStream.data(record => {
            expect(record.indexOf(SDS.stream)).toBeGreaterThanOrEqual(0);
            expect(record.indexOf(SDS.payload)).toBeGreaterThanOrEqual(0);

            const store = RdfStore.createDefault();
            new Parser().parse(record).forEach(q => store.addQuad(q));

            // Check which classes we got
            for (const classSuffix of observedClasses.keys()) {
                if (record.includes(classSuffix)) {
                    observedClasses.set(classSuffix, true);
                }
            }

            // Extract timestamp property (ex:modified in this LDES)
            const timestampQ = store.getQuads(null, EX.terms.modified)[0];
            expect(timestampQ).toBeDefined();
            // Check that member is within date constraints
            expect(new Date(timestampQ.object.value).getTime()).toBeGreaterThan(new Date("2024-09-18T09:00:00.000Z").getTime());
            expect(new Date(timestampQ.object.value).getTime()).toBeLessThan(new Date("2024-09-18T10:53:00.000Z").getTime());
            // Keep track of timestamp for checking order
            timestamps.push(new Date(timestampQ.object.value).getTime());
            // Keep track of member IDs
            const memberId = store.getQuads(null, SDS.terms.payload)[0].object.value;
            expect(memberIds.has(memberId)).toBeFalsy();
            memberIds.add(memberId);
            // Check the version property is not present
            expect(store.getQuads(null, df.namedNode(EX.isVersionOf)).length).toBe(0);
            count++;
        });

        // Setup client
        const exec = await processor(
            outputStream,
            ATYPICAL_LDES,
            new Date("2024-09-18T10:53:00.000Z"),
            new Date("2024-09-18T09:00:00.000Z"),
            "none",
            false,
            undefined,
            "http://localhost:3000/full-shape.ttl",
            false,
            undefined,
            false,
            false,
            undefined,
            undefined,
            true, // Materialized members
            true // Last version only
        );

        // Run client
        await exec();
        // Check we got some members
        expect(count).toBe(6);
        // Check result was ordered (in descending order due to last version only)
        const isSorted = timestamps.every((v, i) => (i === 0 || v <= timestamps[i - 1]));
        expect(isSorted).toBeTruthy();
        // Check we saw all expected classes
        expect(Array.from(observedClasses.values()).every(v => v === true)).toBeTruthy();
    });
});
