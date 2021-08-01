import React, { Fragment } from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import { RichText } from 'prismic-dom';
import { FiCalendar, FiClock, FiUser, FiEdit } from 'react-icons/fi';
import Prismic from '@prismicio/client';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Link from 'next/link';
import Head from 'next/head';


import Header from '../../components/Header';
import Comments from '../../components/Comments';


import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';




interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
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
  preview: boolean;
  navigation: {
    prevPost: {
      uid: string;
      data: {
        title: string;
      };
    }[];
    nextPost: {
      uid: string;
      data: {
        title: string;
      };
    }[];
  }
}

export default function Post({ post, navigation, preview }: PostProps) {
  const { isFallback } = useRouter();

  const totalWords = post.data.content.reduce((total, contentItem) => {
    total += contentItem.heading.split(' ').length;

    const words = contentItem.body.map(item => item.text.split(' ').length);
    words.map(word => (total += word));
    return total;
  }, 0);
  const readTime = Math.ceil(totalWords / 200);

  const formatedDate = format(
    new Date(post.first_publication_date),
    'dd MMM yyyy',
    {
      locale: ptBR,
    }
  );

  const isPostEdited =
    post.first_publication_date !== post.last_publication_date;

  let editionDate;
  if (isPostEdited) {
    editionDate = format(
      new Date(post.last_publication_date),
      "'editado em' dd MMM yyyy', às' H':'m",
      {
        locale: ptBR,
      }
    );
  }

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
                  <time>{`${readTime} min`}</time>
                </div>
                <div>
                  <FiEdit />
                  {isPostEdited && editionDate}
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

            <section className={`${styles.navigation} ${commonStyles.container}`}>
              {navigation?.prevPost.length > 0 && (
                <div>
                  <h3>{navigation.prevPost[0].data.title}</h3>
                  <Link href={`/post/${navigation.prevPost[0].uid}`}>
                    <a>Post anterior</a>
                  </Link>
                </div>
              )}

              {navigation?.nextPost.length > 0 && (
                <div>
                  <h3>{navigation.nextPost[0].data.title}</h3>
                  <Link href={`/post/${navigation.nextPost[0].uid}`}>
                    <a>Próximo post</a>
                  </Link>
                </div>
              )}
            </section>

            <Comments />

            {preview && (
              <footer>
                <Link href="/api/exit-preview">
                  <a className={commonStyles.preview}>
                    Sair do modo preview
                  </a>
                </Link>
              </footer>
            )}

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

export const getStaticProps: GetStaticProps = async ({ params, preview = false, previewData }) => {
  const prismic = getPrismicClient();
  const { slug } = params;

  const response = await prismic.getByUID('posts', String(slug), {
    ref: previewData?.ref || null,
  });

  const prevPost = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')], {
      pageSize: 1,
      after: response.id,
      orderings: '[document.first_publication_date]',
    }
  );

  const nextPost = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')], {
      pageSize: 1,
      after: response.id,
      orderings: '[document.first_publication_date desc]',
    }
  );

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date,
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
      preview,
      navigation: {
        prevPost: prevPost?.results,
        nextPost: nextPost?.results
      }
    },
  };
}
