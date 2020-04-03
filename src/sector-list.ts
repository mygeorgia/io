import * as d3 from "d3";
import { Sector, WebApi } from "./webapi";
import { BaseType } from "d3";
import * as colors from "./colors";


interface ListConfig {
    selector: string;
    endpoint: string;
    model: string;
    apikey?: string;
}

export function on(config: ListConfig): SectorList {
    const s = new SectorList(config);
    s.init();
    return s;
}

export class SectorList {

    private webapi: WebApi;
    private config: ListConfig;
    private sectors: Sector[] = [];
    private selection: Sector[] = [];
    private root: d3.Selection<BaseType, any, HTMLElement, any>;

    constructor(config: ListConfig) {
        this.config = config;
        this.webapi = new WebApi(
            config.endpoint, config.model, config.apikey);
    }

    async init() {
        this.sectors = await this.webapi.get("/sectors");
        this.root = d3.select(this.config.selector)
            .append("div");
        this.render();
    }

    private render() {
        this.sectors.sort((s1, s2) => this.compare(s1, s2));
        this.root.selectAll("*")
            .remove();

        const divs = this.root
            .selectAll("div")
            .data(this.sectors)
            .enter()
            .append("div")
            .style("margin", "1px")
            .style("padding", "1px")
            .style("border", (s) => {
                const idx = this.selection.indexOf(s);
                if (idx < 0) {
                    return "none";
                } else {
                    const color = colors.toCSS(colors.getChartColor(idx));
                    return `${color} solid 1px`;
                }
            })
            .style("background-color", (s) => {
                const idx = this.selection.indexOf(s);
                if (idx < 0) {
                    return "white";
                } else {
                    return colors.toCSS(colors.getChartColor(idx), 0.1);
                }
            })

        divs.append("input")
            .attr("type", "checkbox")
            .attr("value", (s) => s.code)
            .property("checked", (s) => this.isSelected(s))
            .on("click", (s) => this.selectionChanged(s));

        divs.append("label")
            .text((s) => s.name)
            .on("click", (s) => this.selectionChanged(s));
    }

    private isSelected(s: Sector): boolean {
        if (!s || !s.code) {
            return false;
        }
        return this.selection.indexOf(s) >= 0;
    }

    private selectionChanged(s: Sector) {
        if (!s || !s.code) {
            return;
        }
        const idx = this.selection.indexOf(s);
        if (idx < 0) {
            this.selection.push(s);
        } else {
            this.selection.splice(idx, 1);
        }
        this.selection.sort(
            (s1, s2) => s1.name && s2.name
                ? s1.name.localeCompare(s2.name)
                : 0);
        this.render();
        // TODO: fire events...
    }

    private compare(s1: Sector, s2: Sector): number {
        const s1Selected = this.isSelected(s1);
        const s2Selected = this.isSelected(s2);
        if (s1Selected === s2Selected) {
            if (!s1.name || !s2.name) {
                return 0;
            }
            return s1.name.localeCompare(s2.name);
        }
        return s1Selected ? -1 : 1;
    }

}