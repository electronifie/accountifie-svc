#!/usr/bin/env bash

# inspired by http://benlimmer.com/2013/12/26/automatically-publish-javadoc-to-gh-pages-with-travis-ci/

if [ "$TRAVIS_REPO_SLUG" == "electronifie/accountifie-svc" ] && [ "$TRAVIS_NODE_VERSION" == "4.1" ] && [ "$TRAVIS_PULL_REQUEST" == "false" ] && [ "$TRAVIS_BRANCH" == "master" ]; then

  echo -e "Building docs...\n"
  make docs

  echo -e "Publishing docs...\n"
  mv ./docs $HOME/api-docs

  cd $HOME
  git config --global user.email "travis@travis-ci.org"
  git config --global user.name "travis-ci"
  git clone --quiet --branch=gh-pages https://${GH_TOKEN}@github.com/electronifie/accountifie-svc gh-pages > /dev/null

  cd gh-pages
  mv .git ../.git_backup
  rm -r *
  mv ../.git_backup .git
  cp -rf $HOME/api-docs/* .
  git add -f .
  git commit -m "Updating autogen'd docs for travis build $TRAVIS_BUILD_NUMBER."
  git push -fq origin gh-pages > /dev/null

  echo -e "Published docs to gh-pages."

fi
