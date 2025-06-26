import {
    Badge,
    Spinner,
    Tooltip,
    Text,
    Link,
} from "@fluentui/react-components";
import {
    ClockRegular,
    SparkleRegular,
    WandRegular,
    CheckmarkRegular,
    SearchRegular,
    GlobeRegular,
} from "@fluentui/react-icons";
import { WeiboIcon } from "./WeiboIcon";

interface ToolProps {
    name?: string;
    parameter: string;
    working: boolean;
}
type ImageGenerationParameter = {
    prompt: string;
};

type SearchParameter = {
    keywords: string;
};

type BrowseWebPageParameter = {
    url: string;
};

export function ImageGenerateTool(props: ToolProps) {
    const { parameter } = props;
    const param = JSON.parse(parameter) as ImageGenerationParameter;
    return (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Tooltip content={param.prompt} relationship="label">
                <Badge
                    size="medium"
                    color="informative"
                    appearance="filled"
                    icon={<WandRegular />}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                        }}
                    >
                        <Text size={200}>
                            Generate image: {param.prompt.substring(0, 100)}...
                        </Text>
                        {props.working ? (
                            <Spinner size="extra-small" />
                        ) : (
                            <CheckmarkRegular style={{ fontSize: "12px" }} />
                        )}
                    </div>
                </Badge>
            </Tooltip>
        </div>
    );
}

export function TimeTool(props: ToolProps) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Badge
                size="medium"
                color="brand"
                appearance="filled"
                icon={<ClockRegular />}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                    }}
                >
                    <Text size={200}>Check current time</Text>
                    {props.working ? (
                        <Spinner size="extra-small" />
                    ) : (
                        <CheckmarkRegular style={{ fontSize: "12px" }} />
                    )}
                </div>
            </Badge>
        </div>
    );
}

export function WeiboTool(props: ToolProps) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Badge
                size="medium"
                color="warning"
                appearance="filled"
                icon={<WeiboIcon />}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                    }}
                >
                    <Text size={200}>Check hot topics on Weibo</Text>
                    {props.working ? (
                        <Spinner size="extra-small" />
                    ) : (
                        <CheckmarkRegular style={{ fontSize: "12px" }} />
                    )}
                </div>
            </Badge>
        </div>
    );
}

export function DefaultTool(props: ToolProps) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Tooltip
                content={`Parameter: ${tryParseParameter(props.parameter)}`}
                relationship="label"
            >
                <Badge
                    size="medium"
                    color="subtle"
                    appearance="filled"
                    icon={<SparkleRegular />}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                        }}
                    >
                        <Text size={200}>Calling tool: {props.name}</Text>
                        {props.working ? (
                            <Spinner size="extra-small" />
                        ) : (
                            <CheckmarkRegular style={{ fontSize: "12px" }} />
                        )}
                    </div>
                </Badge>
            </Tooltip>
        </div>
    );
}

function tryParseParameter(parameterJson: string): string {
    let parameter = "";
    try {
        const param = JSON.parse(parameterJson);
        let isFirst = true;
        // for each key
        for (const key in param) {
            if (param.hasOwnProperty(key)) {
                const value = param[key];
                if (!isFirst) {
                    parameter += ", ";
                }
                if (typeof value === "string") {
                    parameter += `${key}= ${value}`;
                } else if (typeof value === "object") {
                    parameter += `${key}= ${JSON.stringify(value)}`;
                } else {
                    parameter += `${key}= ${value}`;
                }
                isFirst = false;
            }
        }
    } catch (e) {
        console.error("Error parsing parameter JSON:", e);
        parameter = parameterJson; // fallback to raw string
    }
    return parameter;
}

export function SearchTool(props: ToolProps) {
    const { parameter } = props;
    const param = JSON.parse(parameter) as SearchParameter;
    return (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Badge
                size="medium"
                color="success"
                appearance="filled"
                icon={<SearchRegular />}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                    }}
                >
                    <Text size={200}>Search: {param.keywords}</Text>
                    {props.working ? (
                        <Spinner size="extra-small" />
                    ) : (
                        <CheckmarkRegular style={{ fontSize: "12px" }} />
                    )}
                </div>
            </Badge>
        </div>
    );
}

export function BrowseWebPageTool(props: ToolProps) {
    const { parameter } = props;
    const param = JSON.parse(parameter) as BrowseWebPageParameter;
    return (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Badge
                size="medium"
                color="danger"
                appearance="filled"
                icon={<GlobeRegular />}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                    }}
                >
                    <Text size={200}>
                        Visit:
                        <Link
                            href={param.url}
                            target="_blank"
                            style={{ color: "inherit", marginLeft: "4px" }}
                        >
                            {param.url.substring(0, 60)}...
                        </Link>
                    </Text>
                    {props.working ? (
                        <Spinner size="extra-small" />
                    ) : (
                        <CheckmarkRegular style={{ fontSize: "12px" }} />
                    )}
                </div>
            </Badge>
        </div>
    );
}
