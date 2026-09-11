import React from 'react';
import type { Block, Book } from '../../types/book';
import { Paragraph, Heading, Quote, UnorderedList, Separator, LinkButton } from './TypographyBlocks';
import { ImageBlock } from './ImageBlock';
import { MapBlock } from './MapBlock';

interface BlockRendererProps {
    block: Block;
    isIndex?: boolean;
    fontSize: number;
    activeBook?: Book | null;
    onNavigate?: (chapterId: string) => void;
}

export const BlockRenderer = React.memo<BlockRendererProps>(({ block, isIndex, fontSize, activeBook, onNavigate }) => {
    switch (block.type) {
        case 'paragraph':
            return <Paragraph content={block.content || ''} className={block.metadata?.className} fontSize={fontSize} />;
        case 'image':
            return <ImageBlock block={block} />;
        case 'heading':
            return (
                <Heading
                    content={block.content || ''}
                    level={block.metadata?.level || 1}
                    className={block.metadata?.className}
                    fontSize={fontSize}
                />
            );
        case 'quote':
            return <Quote content={block.content || ''} author={block.metadata?.author} fontSize={fontSize} />;
        case 'list':
            return (
                <UnorderedList
                    items={block.metadata?.items || []}
                    className={block.metadata?.className}
                    isIndex={isIndex}
                    fontSize={fontSize}
                    activeBook={activeBook}
                    onNavigate={onNavigate}
                />
            );
        case 'separator':
            return <Separator />;
        case 'link':
            return <LinkButton content={block.content || ''} url={block.metadata?.url || '#'} fontSize={fontSize} />;
        case 'map':
            return <MapBlock block={block} />;
        default:
            console.warn(`Unknown block type: ${block.type}`);
            return null;
    }
});
