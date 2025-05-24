/**
 * @import {Root} from 'mdast'
 * @import {Options} from 'remark-math'
 * @import {} from 'remark-parse'
 * @import {} from 'remark-stringify'
 * @import {Processor} from 'unified'
 */

import { mathFromMarkdown, mathToMarkdown } from "mdast-util-math";
import { math, Options } from "micromark-extension-llm-math";

/** @type {Readonly<Options>} */
const emptyOptions = {};

/**
 * Add support for math.
 *
 * @param {Readonly<Options> | null | undefined} [options]
 *   Configuration (optional).
 * @returns {undefined}
 *   Nothing.
 */
export default function remarkMath(options: Readonly<Options>) {
	// @ts-expect-error: TS is wrong about `this`.
	const self = /** @type {Processor<Root>} */ this;
	const settings = options || emptyOptions;
	const data = self.data();

	const micromarkExtensions =
		data.micromarkExtensions || (data.micromarkExtensions = []);
	const fromMarkdownExtensions =
		data.fromMarkdownExtensions || (data.fromMarkdownExtensions = []);
	const toMarkdownExtensions =
		data.toMarkdownExtensions || (data.toMarkdownExtensions = []);

	micromarkExtensions.push(math(settings));
	fromMarkdownExtensions.push(mathFromMarkdown());
	toMarkdownExtensions.push(mathToMarkdown(settings));
}
