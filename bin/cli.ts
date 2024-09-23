#!/usr/bin/env node
import * as process from "process";
import { Ordered, replicateLDES } from "../lib/client";
import { intoConfig } from "../lib/config";
import { Command, Option } from "commander";
import { Writer } from "n3";
import { enhanced_fetch, FetchConfig, processConditionFile } from "../lib/utils";
import { getLoggerFor } from "../lib/utils/logUtil";

const program = new Command();
let paramURL: string = "";
let polling: boolean = false;
let after: Date | undefined;
let before: Date | undefined;
let materialize: boolean = false;
let lastVersionOnly: boolean = false;
let conditionFile: string | undefined;
let paramPollInterval: number;
let urlIsView = false;
let noShape = false;
let shapeFile: string | undefined;
let ordered: Ordered = "none";
let quiet: boolean = false;
let save: string | undefined;
let onlyDefaultGraph: boolean = false;
let loose: boolean = false;
let defaultTimezone: string | undefined;

const fetch_config: FetchConfig = {
    retry: {},
};

program
    .arguments("<url>")
    .addOption(
        new Option("-o --ordered <ordered>", "emit members in order")
            .choices(["ascending", "descending", "none"])
            .default("none"),
    )
    .option("-f, --follow", "follow the LDES, the client stays in sync")
    .option(
        "--after <after>",
        "follow only relations including members after a certain point in time",
    )
    .option(
        "--before <before>",
        "follow only relations including members before a certain point in time",
    )
    .option(
        "--materialize-version",
        "materialize versioned member based on the ldes:isVersionOfPath predicate"
    )
    .option(
        "--last-version-only",
        "emit only the latest available version of every member"
    )
    .option(
        "--condition <condition_file>",
        "turtle file including the conditions for extracting a member",
    )
    .option("--poll-interval <number>", "specify poll interval")
    .option("--shape-file <shapeFile>", "specify a shapefile")
    .option(
        "--no-shape",
        "don't extract members with a shape (only use cbd and named graphs)",
    )
    .option(
        "--only-default-graph",
        "extract members only from the default graph and the member graph",
    )
    .option(
        "-s, --save <path>",
        "filepath to the save state file to use, used both to resume and to update",
    )
    .option(
        "-l --loose",
        "use loose implementation, might work on more ldes streams",
    )
    .option(
        "--url-is-view",
        "the url is the view url, don't try to find the correct view",
    )
    .option("-q --quiet", "be quiet")
    .option("--basic-auth <username>:<password>", "HTTP basic auth information")
    .option(
        "--concurrent <requests>",
        "Allowed amount of concurrent HTTP request to the same domain",
        "5",
    )
    .option(
        "--retry-count <retry>",
        "Retry count per failing request (0 is infinite)",
        "3",
    )
    .option("--http-codes [codes...]", "What HTTP codes to retry")
    .option("-t --default-timezone <timezone>", "Default timezone for dates in tree:InBetweenRelation", "AoE")
    .action((url: string, program) => {
        urlIsView = program.urlIsView;
        noShape = !program.shape;
        save = program.save;
        paramURL = url;
        shapeFile = program.shapeFile;
        polling = program.follow;
        paramPollInterval = program.pollInterval;
        ordered = program.ordered;
        quiet = program.quiet;
        loose = program.loose;
        onlyDefaultGraph = program.onlyDefaultGraph;
        conditionFile = program.condition;
        materialize = program.materializeVersion;
        lastVersionOnly = program.lastVersionOnly;
        defaultTimezone = program.defaultTimezone;

        fetch_config.concurrent = parseInt(program.concurrent);
        if (program.basicAuth) {
            fetch_config.auth = {
                auth: program.basicAuth,
                host: new URL(url).host,
                type: "basic",
            };
        }
        fetch_config.retry!.maxRetries = parseInt(program.retryCount);
        if (program.httpCodes) {
            fetch_config.retry!.codes = program.httpCodes.map(parseInt);
        }

        if (program.after) {
            if (!isNaN(new Date(program.after).getTime())) {
                after = new Date(program.after);
            } else {
                console.error(`--after ${program.after} is not a valid date`);
                process.exit();
            }
        }
        if (program.before) {
            if (!isNaN(new Date(program.before).getTime())) {
                before = new Date(program.before);
            } else {
                console.error(`--before ${program.before} is not a valid date`);
                process.exit();
            }
        }
    });

program.parse(process.argv);

async function main() {
    const logger = getLoggerFor("cli");
    let fragmentCount = 0;

    const client = replicateLDES(
        intoConfig({
            loose,
            noShape,
            polling: polling,
            url: paramURL,
            stateFile: save,
            pollInterval: paramPollInterval,
            urlIsView: urlIsView,
            after,
            before,
            shapeFile,
            onlyDefaultGraph,
            condition: await processConditionFile(conditionFile),
            defaultTimezone,
            materialize,
            lastVersionOnly,
            fetch: enhanced_fetch(fetch_config),
        }),
        ordered,
    );

    client.on("fragment", () => {
        fragmentCount += 1;
    });

    client.on("fragment", () => {
        logger.verbose("Fragment!");
    });

    if (!quiet) {
        client.on("error", (error) => {
            console.error("Error", error);
        });
    }

    const reader = client.stream({ highWaterMark: 10 }).getReader();
    let el = await reader.read();
    let count = 0;
    while (el) {
        if (el.value) {
            count += 1;

            if (!quiet) {
                logger.debug(new Writer().quadsToString(el.value.quads));

                if (count % 100 == 1) {
                    logger.verbose(
                        `Got member ${count} with ${el.value.quads.length} quads`,
                    );
                }
            }
        }

        if (el.done) {
            break;
        }

        el = await reader.read();
    }

    if (!quiet) {
        console.error("Found", count, "members in", fragmentCount, "fragments");
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
