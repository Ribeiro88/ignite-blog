
import { useState } from 'react';
import { FiCalendar, FiUser } from 'react-icons/fi';

import Header from '../components/Header';

import Head from 'next/head';
import Link from 'next/link';
import { GetStaticProps } from 'next';

import Prismic from '@prismicio/client';
import { getPrismicClient } from '../services/prismic';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination } : HomeProps) {
  const [posts, setPosts] = useState(postsPagination);

  function handleLoadPost() {
    fetch(posts.next_page).then(response => response.json()).then(data => {
      const newPost = data.results.map(post => ({
        uid: post.uid,
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        },
        first_publication_date: format(
          new Date(post.first_publication_date),
          'dd MMM yyyy',
          { locale: ptBR }
        ),
      }));

      setPosts({
        results: [...posts.results, ...newPost],
        next_page: data.next_page,
      });
    });
  }

  return (
    <>
      <Head>
        <title>SpaceTraveling - Home</title>
      </Head>

      <Header />
      <main className={commonStyles.postContainer}>

        <ul className={styles.postList}>
          {posts.results.map(post => (
            <Link key={post.uid} href={`/post/${post.uid}`}>
              <li>
                  <h1>{post.data.title}</h1>
                  <h2>{post.data.subtitle}</h2>
                  <div className={styles.postInfo}>
                    <div>
                        <FiCalendar />
                        <time>
                            {format(
                              new Date(post.first_publication_date),
                              'dd MMM yyyy',
                              { locale: ptBR }
                            )}
                        </time>
                    </div>
                    <div>
                      <FiUser />
                      <p>{post.data.author}</p>
                    </div>
                </div>
              </li>
            </Link>
          ))}
        </ul>

        {posts.next_page && (
          <button type="button" className={styles.button} onClick={handleLoadPost}>
            Carregar mais posts
          </button>                        
        )}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  
 
  const postsResponse = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
      pageSize: 1,
      
    },
  );


  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
      first_publication_date: post.first_publication_date,
    };
  });


  return {
    props: {
      postsPagination: {
        results: posts,
        next_page: postsResponse.next_page,
      },
    },
  };
};
