import weibo from "./weibo.svg";

export function WeiboIcon() {
    return (
        <img
            src={weibo}
            alt="Weibo"
            style={{
                width: "24px",
                height: "24px",
                display: "inline-block",
                verticalAlign: "middle",
            }}
        />
    );
}
