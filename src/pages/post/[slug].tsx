import React, { Fragment } from 'react';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { GetStaticPaths, GetStaticProps } from 'next';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';
import Header from '../../components/Header';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';


interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const { isFallback } = useRouter();

  const formatedDate = format(
    new Date(post.first_publication_date),
    'dd MMM yyyy',
    {
      locale: ptBR,
    }
  );

  return (
    <>
      <Head>
        <title>SpaceTraveling - {post.data.title}</title>
      </Head>
      {isFallback ? (
        <div>Carregando...</div>
      ) : (
        <>
          <Header />

          <img src={post.data.banner.url} alt="Post Imagem" className={styles.banner} />

          <main className={commonStyles.postContainer}>
            
            <section className={styles.postContent}>
              <h1>{post.data.title}</h1>
              <div className={styles.postInfo}>
                <div>
                  <FiCalendar />
                  <time>
                    {formatedDate}
                  </time>
                </div>
                <div>
                  <FiUser />
                  <p>{post.data.author}</p>
                </div>
                <div>
                  <FiClock />
                  <time>4 min</time>
                </div>
              </div>
              <div className={styles.postContentBody}>
                {post.data.content.map(contentBody => (
                  <Fragment key={contentBody.heading}>
                    <h2>{contentBody.heading}</h2>
                    <div dangerouslySetInnerHTML={{ __html: RichText.asHtml(contentBody.body) }} />
                  </Fragment>
                ))}
              </div>
            </section>
          </main>
        </>
      )}
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();

  const posts = await prismic.query([
    Prismic.predicates.at('document.type', 'posts'),
  ]);

  const paths = posts.results.map(post => ({
    params: { slug: post.uid },
  }));

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async context => {
  const prismic = getPrismicClient();
  const { slug } = context.params;

  const response = await prismic.getByUID('posts', String(slug), {});

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      author: response.data.author,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      content: response.data.content.map(contentBody => {
        return {
          heading: contentBody.heading,
          body: [...contentBody.body],
        };
      }),
    }
  };

  return {
    props: {
      post,
    },
  };
}
